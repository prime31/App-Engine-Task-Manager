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


# Wipes out all the tags and resets the new ones.  Useful for reordering them
class ResetTags( webapp.RequestHandler ):
	def post( self ):
		result = {
			'result': True,
			'error': ''
		}

		try:
			# input marshalling
			tagJson = unicode( self.request.get( 'tags' ) )
			tags = simplejson.loads( tagJson ) # should be an array!
			
			tagModel = Tags.gql( 'where user = :1', users.GetCurrentUser() ).get()
			tagModel.tags = tags;
			tagModel.put()

		except Exception, e:
			result['result'] = False
			result['error'] = 'Error: %s' % e

		#self.response.headers['Content-Type'] = 'application/json'
		self.response.out.write( simplejson.dumps( result ) )
		

# Adds a new tag
class AddTag( webapp.RequestHandler ):
	def post( self ):
		result = {
			'result': True,
			'error': ''
		}

		try:
			# input marshalling
			tag = self.request.get( 'tag' )
			tagList = [tag]
			user = users.GetCurrentUser()

			# add the new tags in case we don't have them already
			Tags.InsertIfNotHere( users.GetCurrentUser(), tagList )

			result['data'] = Tags.gql( 'where user = :1', user ).get().tags

		except Exception, e:
			result['result'] = False
			result['error'] = 'Error: %s' % e

		#self.response.headers['Content-Type'] = 'application/json'
		self.response.out.write( simplejson.dumps( result ) )


# Removes a new tag
class RemoveTag( webapp.RequestHandler ):
	def post( self ):
		result = {
			'result': True,
			'error': ''
		}

		try:
			# input marshalling
			tag = self.request.get( 'tag' )
			user = users.GetCurrentUser()
			
			# add the new tags in case we don't have them already
			Tags.RemoveTag( user, tag )

			result['data'] = Tags.gql( 'where user = :1', user ).get().tags

		except Exception, e:
			result['result'] = False
			result['error'] = 'Error: %s' % e

		#self.response.headers['Content-Type'] = 'application/json'
		self.response.out.write( simplejson.dumps( result ) )


# Renames a new tag
class RenameTag( webapp.RequestHandler ):
	def post( self ):
		result = {
			'result': True,
			'error': ''
		}

		try:
			# input marshalling
			oldTag = self.request.get( 'oldTag' )
			newTag = self.request.get( 'newTag' )
			user = users.GetCurrentUser()

			# remove the old tag, add the new tag and update all the Tasks with the tag
			Tags.RenameTag( user, oldTag, newTag )
			
			result['data'] = Tags.gql( 'where user = :1', user ).get().tags

		except Exception, e:
			result['result'] = False
			result['error'] = 'Error: %s' % e

		#self.response.headers['Content-Type'] = 'application/json'
		self.response.out.write( simplejson.dumps( result ) )


# Cleans up all unused tags
class RemoveUnusedTags( webapp.RequestHandler ):
	@login_required
	def get( self ):
		result = {
			'result': True,
			'error': ''
		}

		try:
			user = users.GetCurrentUser()
			
			# kill all the unused tags
			Tags.RemoveUnusedTags( user )
			
			# grab all the available tags
			tags = Tags.gql( 'where user = :1', user ).get()
			result['tags'] = tags.tags

		except Exception, e:
			result['result'] = False
			result['error'] = 'Error: %s' % e

		#self.response.headers['Content-Type'] = 'application/json'
		self.response.out.write( simplejson.dumps( result ) )

