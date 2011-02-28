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


# Adds a new comment to a task
class AddComment( webapp.RequestHandler ):
	def post( self ):
		result = {
			'result': True,
			'error': ''
		}

		try:
			# input marshalling
			projectId = int( self.request.get( 'projectId' ) )
			taskId = int( self.request.get( 'taskId' ) )
			comment = self.request.get( 'comment' )
			
			# grab the task
			task = Task.get_by_id( taskId, Key.from_path( 'Project', projectId ) )

			# create
			c = Comment( parent = task, text = comment )
			c.put()

			result['data'] = c.toDict()

		except Exception, e:
			result['result'] = False
			result['error'] = 'Error: %s' % e

		#self.response.headers['Content-Type'] = 'application/json'
		self.response.out.write( simplejson.dumps( result ) )


# removes a comment
class RemoveComment( webapp.RequestHandler ):
	def post( self ):
		result = {
			'result': True,
			'error': ''
		}

		try:
			# input marshalling
			commentId = int( self.request.get( 'commentId' ) )
			taskId = int( self.request.get( 'taskId' ) )
			projectId = int( self.request.get( 'projectId' ) )
			
			# grab the comment and kill it
			comment = Comment.get_by_id( commentId, Key.from_path( 'Project', projectId, 'Task', taskId ) )
			comment.delete()

		except Exception, e:
			result['result'] = False
			result['error'] = 'Error: %s' % e

		#self.response.headers['Content-Type'] = 'application/json'
		self.response.out.write( simplejson.dumps( result ) )

