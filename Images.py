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


# Get an image
class GetImage( webapp.RequestHandler ):
	def get( self, projectId, taskId, imageId ):
		taskId = int( taskId )
		imageId = int( imageId )
		projectId = int( projectId )
		
		image = Image.get_by_id( imageId, Key.from_path( 'Project', projectId, 'Task', taskId ) )
		
		# figure out the mime type based on the filename
		extension = os.path.splitext( image.filename )[1][1:]
		mimeType = 'image/%s' % extension

		self.response.headers['Cache-Control'] = 'max-age=2592000'
		self.response.headers['Content-Type'] = mimeType
		self.response.out.write( image.image )


# Adds a new image to a task
class AddImage( webapp.RequestHandler ):
	def post( self ):
		result = {
			'result': True,
			'error': ''
		}

		try:
			# input marshalling
			projectId = int( self.request.get( 'projectId' ) )
			taskId = int( self.request.get( 'taskId' ) )
			filename = self.request.POST['image'].filename
			imageData = self.request.get( 'image' )
			
			# grab the task
			task = Task.get_by_id( taskId, Key.from_path( 'Project', projectId ) )

			# create
			theImage = db.Blob( imageData )
			i = Image( parent = task, filename = filename, image = theImage )
			i.put()

		except Exception, e:
			result['result'] = False
			result['error'] = 'Error: %s' % e

		#self.response.headers['Content-Type'] = 'application/json'
		self.response.out.write( simplejson.dumps( result ) )


# removes an image
class RemoveImage( webapp.RequestHandler ):
	def post( self ):
		result = {
			'result': True,
			'error': ''
		}

		try:
			# input marshalling
			imageId = int( self.request.get( 'imageId' ) )
			taskId = int( self.request.get( 'taskId' ) )
			projectId = int( self.request.get( 'projectId' ) )
			
			# grab the comment and kill it
			image = Image.get_by_id( imageId, Key.from_path( 'Project', projectId, 'Task', taskId ) )
			image.delete()

		except Exception, e:
			result['result'] = False
			result['error'] = 'Error: %s' % e

		#self.response.headers['Content-Type'] = 'application/json'
		self.response.out.write( simplejson.dumps( result ) )

