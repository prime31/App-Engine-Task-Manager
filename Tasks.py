#!/usr/bin/env python

from google.appengine.api import users
from google.appengine.ext import webapp
import logging
import os
import sys

from google.appengine.ext.db import Key
from google.appengine.ext.webapp import util
from google.appengine.ext.webapp import template
from google.appengine.ext.webapp.util import login_required
from django.utils import simplejson

from Models import *


class GetTasksForProjectOrTag( webapp.RequestHandler ):
	@login_required
	def get( self ):
		# input marshalling
		projectId = self.request.get( 'projectId' )
		tag = self.request.get( 'tag' );
		
		# grab the task for the projectId or tag
		if len( projectId ) > 0:
			tasks = Task.AllTasksForProject( Key.from_path( 'Project', int( projectId ) ) )
			taskList = [t.toDict() for t in tasks]
		elif tag != None:
			tasks = Task.AllTasksWithTag( tag )
			taskList = [t.toDict() for t in tasks]
		
		#self.response.headers['Content-Type'] = 'application/json'
		self.response.out.write( simplejson.dumps( taskList ) )


class GetAllCompletedTasks( webapp.RequestHandler ):
	@login_required
	def get( self ):
		tasks = Task.AllCompletedTasks()
		taskList = [t.toDict() for t in tasks]
		
		#self.response.headers['Content-Type'] = 'application/json'
		self.response.out.write( simplejson.dumps( taskList ) )


# grabs the task and all it's comments and images
class GetTask( webapp.RequestHandler ):
	@login_required
	def get( self ):
		result = {
			'result': True,
			'error': ''
		}

		# input marshalling
		taskId = int( self.request.get( 'taskId' ) )
		projectId = int( self.request.get( 'projectId' ) )
		
		try:
			# grab the task
			task = Task.get_by_id( taskId, Key.from_path( 'Project', projectId ) )
			result['task'] = task.toDict()

			# add the comments and images
			result['comments'] = [c.toDict() for c in task.comments]
			result['images'] = [i.toDict() for i in task.images]
			
		except Exception, e:
			result['result'] = False
			result['error'] = 'Error: %s' % e
		
		#self.response.headers['Content-Type'] = 'application/json'
		self.response.out.write( simplejson.dumps( result ) )


# Adds a new task to a project
class AddTask( webapp.RequestHandler ):
	def post( self ):
		result = {
			'result': True,
			'error': ''
		}

		try:
			# input marshalling
			projectId = int( self.request.get( 'projectId' ) )
			title = self.request.get( 'title' )
			description = self.request.get( 'description' )
			tagJson = unicode( self.request.get( 'tags' ) )

			tags = simplejson.loads( tagJson ) # should be an array!
			user = users.GetCurrentUser()
			
			# add the new tags in case we don't have them already
			Tags.InsertIfNotHere( user, tags )

			# grab the project and the sortOrder
			project = Project.get_by_id( projectId )
			sortOrder = Task.NextSortOrderForProject( project )

			# create
			t = Task( parent = project, tags = tags, description = description,
					  title = title, sortOrder = sortOrder, user = user )
			t.put()

			result['data'] = t.toDict()

		except Exception, e:
			result['result'] = False
			result['error'] = 'Error: %s' % e

		#self.response.headers['Content-Type'] = 'application/json'
		self.response.out.write( simplejson.dumps( result ) )


# Reorders all the tasks in the given project
class ReorderTasks( webapp.RequestHandler ):
	def post( self ):
		result = {
			'result': True,
			'error': ''
		}

		try:
			# input marshalling
			projectId = int( self.request.get( 'projectId' ) )

			orderJson = unicode( self.request.get( 'order' ) )
			orderList = simplejson.loads( orderJson ) # should be an array of dicts [{id: 3, sortOrder:3}]!
			
			# we need a list of dictionaries
			if type( orderList ).__name__ != 'list' or type( orderList[0] ).__name__ != 'dict':
				raise Exception( 'order must be a list of dictionaries!' )
			
			# grab the project so we can have at the tasks
			project = Project.get_by_id( projectId )
			
			# we need the list to have the same number eles as we have tasks
			if len( orderList ) != project.tasks.count( 1000 ):
				raise Exception( 'order must have the same number of elements as there are tasks in the project!' )

			db.run_in_transaction( self.reorder, orderList, project )

		except Exception, e:
			result['result'] = False
			result['error'] = 'Error: %s' % e

		#self.response.headers['Content-Type'] = 'application/json'
		self.response.out.write( simplejson.dumps( result ) )

	def reorder( self, orderList, project ):
		for item in orderList:
			task = Task.get_by_id( item['id'], project )
			task.sortOrder = item['sortOrder']
			task.put()


# Edits a task.  This essentially kills all properties and resets them (except sortOrder)
class EditTask( webapp.RequestHandler ):
	def post( self ):
		result = {
			'result': True,
			'error': ''
		}

		try:
			# input marshalling
			taskId = int( self.request.get( 'taskId' ) )
			projectId = int( self.request.get( 'projectId' ) )
			title = self.request.get( 'title' )
			description = self.request.get( 'description' )
			tagJson = unicode( self.request.get( 'tags' ) )

			tags = simplejson.loads( tagJson ) # should be an array!

			# add the new tags in case we don't have them already
			Tags.InsertIfNotHere( users.GetCurrentUser(), tags )

			# grab the task
			task = Task.get_by_id( taskId, Key.from_path( 'Project', projectId ) )
			task.title = title
			task.description = description
			task.tags = tags
			task.put()

			result['data'] = task.toDict()

		except Exception, e:
			result['result'] = False
			result['error'] = 'Error: %s' % e

		#self.response.headers['Content-Type'] = 'application/json'
		self.response.out.write( simplejson.dumps( result ) )


# Removes a task
class RemoveTask( webapp.RequestHandler ):
	def post( self ):
		result = {
			'result': True,
			'error': ''
		}

		try:
			# input marshalling
			taskId = int( self.request.get( 'taskId' ) )
			projectId = int( self.request.get( 'projectId' ) )

			# grab the task
			task = Task.get_by_id( taskId, Key.from_path( 'Project', projectId ) )
			task.removeAllComments()
			task.removeAllImages()
			task.delete()

			result['data'] = task.toDict()

		except Exception, e:
			result['result'] = False
			result['error'] = 'Error: %s' % e

		#self.response.headers['Content-Type'] = 'application/json'
		self.response.out.write( simplejson.dumps( result ) )


# Flags or unflags a task as important
class FlagTaskImportant( webapp.RequestHandler ):
	def post( self ):
		result = {
			'result': True,
			'error': ''
		}

		try:
			# input marshalling
			taskId = int( self.request.get( 'taskId' ) )
			projectId = int( self.request.get( 'projectId' ) )
			important = bool( self.request.get( 'important' ) )

			# grab the task
			task = Task.get_by_id( taskId, Key.from_path( 'Project', projectId ) )
			task.important = important
			task.put()

			result['data'] = task.toDict()

		except Exception, e:
			result['result'] = False
			result['error'] = 'Error: %s' % e

		#self.response.headers['Content-Type'] = 'application/json'
		self.response.out.write( simplejson.dumps( result ) )


# Flags or unflags a task as completed
class FlagTaskCompleted( webapp.RequestHandler ):
	def post( self ):
		result = {
			'result': True,
			'error': ''
		}

		try:
			# input marshalling
			taskId = int( self.request.get( 'taskId' ) )
			projectId = int( self.request.get( 'projectId' ) )
			completed = bool( self.request.get( 'completed' ) )

			# grab the task
			task = Task.get_by_id( taskId, Key.from_path( 'Project', projectId ) )
			task.completed = completed
			task.put()

			result['data'] = task.toDict()

		except Exception, e:
			result['result'] = False
			result['error'] = 'Error: %s' % e

		#self.response.headers['Content-Type'] = 'application/json'
		self.response.out.write( simplejson.dumps( result ) )
