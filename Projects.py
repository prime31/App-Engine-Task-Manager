#!/usr/bin/env python

from google.appengine.api import users
from google.appengine.ext import webapp
import logging
import os
import sys

from google.appengine.ext.webapp import util
from google.appengine.ext.webapp import template
from google.appengine.ext.webapp.util import login_required
from django.utils import simplejson

from Models import *


# grabs all the available projects (with tags)
class GetProjects( webapp.RequestHandler ):
	@login_required
	def get( self ):
		result = {
			'projects': None,
			'tags': None,
			'totalTasks': 0,
			'totalImportant': 0
		}
		
		user = users.GetCurrentUser()

		# grab all the projects for the current user
		projects = Project.gql( 'where user = :1 order by sortOrder', user )
		result['projects'] = [p.toDict() for p in projects]

		# grab all the available tags
		tags = Tags.gql( 'where user = :1', user ).get()
		
		if tags == None:
			result['tags'] = []
		else:
			result['tags'] = tags.tags
		
		# count the tasks and important tasks
		result['totalTasks'] = Task.CountAllTasks()
		result['totalImportant'] = Task.CountAllImportantTasks()
		
		#self.response.headers['Content-Type'] = 'application/json'
		self.response.out.write( simplejson.dumps( result ) )


# Adds a new project to the mix
class AddProject( webapp.RequestHandler ):
	def post( self ):
		result = {
			'result': True,
			'error': ''
		}
		
		try:
			# input marshalling
			name = self.request.get( 'projectName' )
			user = users.GetCurrentUser()
		
			# first create the Tags object if we dont have one for the user already
			Tags.CreateTagsForUserIfNotCreated( user )
			
			# get our sortOrder
			sortOrder = Project.NextSortOrder()
		
			# put the project then return it as json
			p = Project( user = user, name = name, sortOrder = sortOrder )
			p.put()
			
			# add this to the return package
			result['data'] = p.toDict()
			
		except Exception, e:
			result['result'] = False
			result['error'] = 'Error: %s' % e
			
		#self.response.headers['Content-Type'] = 'application/json'
		self.response.out.write( simplejson.dumps( result ) )


# Renames a project
class RenameProject( webapp.RequestHandler ):
	def post( self ):
		result = {
			'result': True,
			'error': ''
		}

		try:
			# input marshalling
			projectId = int( self.request.get( 'projectId' ) )
			name = self.request.get( 'projectName' )

			# grab the project by its key and change the name
			project = Project.get_by_id( projectId )
			project.name = name
			project.put()

		except Exception, e:
			result['result'] = False
			result['error'] = 'Error: %s' % e

		#self.response.headers['Content-Type'] = 'application/json'
		self.response.out.write( simplejson.dumps( result ) )


# Reorders the projects
class ReorderProjects( webapp.RequestHandler ):
	def post( self ):
		result = {
			'result': True,
			'error': ''
		}

		try:
			# input marshalling
			orderJson = unicode( self.request.get( 'order' ) )
			orderList = simplejson.loads( orderJson ) # should be an array of dicts [{id: 3, sortOrder:3}]!
			
			# we need a list of dictionaries or we are out of here
			if type( orderList ).__name__ != 'list' or type( orderList[0] ).__name__ != 'dict':
				raise Exception( 'order must be a list of dictionaries!' )

			totalProjects = Project.gql( 'where user = :1', users.GetCurrentUser() ).count( 1000 )

			# we need the list to have the same number eles as we have tasks
			if len( orderList ) != totalProjects:
				raise Exception( 'order must have the same number of elements as there are projects!' )

			self.reorder( orderList )
			#db.run_in_transaction( self.reorder, orderList )

		except Exception, e:
			result['result'] = False
			result['error'] = 'Error: %s' % e

		#self.response.headers['Content-Type'] = 'application/json'
		self.response.out.write( simplejson.dumps( result ) )

	def reorder( self, orderList ):
		for item in orderList:
			project = Project.get_by_id( item['id'] )
			project.sortOrder = item['sortOrder']
			project.put()



# Removes a project and all it's tasks
class RemoveProject( webapp.RequestHandler ):
	def post( self ):
		result = {
			'result': True,
			'error': ''
		}

		try:
			# input marshalling
			projectId = int( self.request.get( 'projectId' ) )
			
			# do this one in a transaction
			db.run_in_transaction( self.removeProject, projectId )

		except Exception, e:
			result['result'] = False
			result['error'] = 'Error: %s' % e

		#self.response.headers['Content-Type'] = 'application/json'
		self.response.out.write( simplejson.dumps( result ) )
	
	def removeProject( self, projectId ):
		# grab the project, kill the tasks then kill ourself
		project = Project.get_by_id( projectId )
		project.removeAllTasks()
		project.delete()

