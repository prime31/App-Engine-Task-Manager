#!/usr/bin/python

import os
from google.appengine.ext import db
import logging
from google.appengine.api import users
from google.appengine.ext.db import GqlQuery


class BaseModel( db.Model ):
	def toDict( self ):
		list = [( p, unicode( getattr( self, p ) ) ) for p in self.properties()]
		list.append( ( 'id', self.key().id() ) )
		return dict( list )


class BaseModelWithFather( BaseModel ):
	def toDict( self ): # override to pass along the parent as a key
		dic = BaseModel.toDict( self )
		dic['parent'] = self.parent().key().id()
		return dic



# tags are saved and managed by user
class Tags( BaseModel ):
	user = db.UserProperty( required = True )
	tags = db.StringListProperty() # all the available tags for the account are here and maintained manually
	
	@classmethod
	def CreateTagsForUserIfNotCreated( cls, user ):
		# grab the tags for this user.  if there are none, create them
		tags = Tags.gql( 'where user = :1', user )
		if tags.count() == 0:
			t = Tags( user = user )
			t.put()

	@classmethod
	def InsertIfNotHere( cls, user, newTagList ):
		if type( newTagList ).__name__ != 'list':
			raise Exception( 'newTagList must be a list!  You passed in a %s' % type( newTagList ).__name__ )
		
		# grab the tags for this user.  if we have a new one, write it
		tags = Tags.gql( 'where user = :1', user )		
		tag = tags.get()
		
		tagsToAdd = set( newTagList ) - set( tag.tags )
		if len( tagsToAdd ) > 0:
			tag.tags.extend( tagsToAdd )
			tag.put()
		
	@classmethod
	def RemoveTag( cls, user, tag ):
		# grab the tags for this user.  kill this tag if its there
		t = Tags.gql( 'where user = :1', user ).get()

		# make sure we have this tag
		if tag in t.tags:
			# remove the tag from all Tasks that have it
			tasksWithTag = Task.AllTasksWithTag( tag )
			for task in tasksWithTag:
				task.tags.remove( tag )
				task.put()
			
			# remove the tag from our tag repo
			t.tags.remove( tag )
			t.put()


	@classmethod
	def RenameTag( cls, user, oldTag, newTag ):
		# grab the tags for this user.  kill this tag if its there
		t = Tags.gql( 'where user = :1', user ).get()

		# make sure we have this tag
		if oldTag in t.tags:
			# remove the tag from all Tasks that have it and add the new one
			tasksWithTag = Task.AllTasksWithTag( oldTag )
			for task in tasksWithTag:
				task.tags.remove( oldTag )
				task.tags.append( newTag )
				task.put()

			# remove the tag from our tag repo and add the new one
			t.tags.remove( oldTag )
			t.tags.append( newTag )
			t.put()

	@classmethod
	def RemoveUnusedTags( cls, user ):
		# grab the tags for this user
		t = Tags.gql( 'where user = :1', user ).get()
		dirty = False
		
		for tag in t.tags:
			tasksWithTag = Task.AllTasksWithTag( tag )
			
			# if we have none, we are clear to remove the tag
			if tasksWithTag.count( 1 ) == 0:
				dirty = True
				t.tags.remove( tag )
		
		# if we are dirty, write to the database
		if dirty:
			t.put()
		

# projects are saved and managed by user
class Project( BaseModel ):
	user = db.UserProperty( required = True )
	created = db.DateTimeProperty( auto_now_add = True )
	name = db.StringProperty( required = True )
	sortOrder = db.IntegerProperty( required = True )
	# magic properties
	# (tasks)
	
	@property
	def tasks( self ):
		return Task.gql( 'where ancestor is :1', self )

	@classmethod
	def NextSortOrder( cls ):
		# grab the task with the highest sort order for the project
		p = Project.gql( 'where user = :1 order by sortOrder desc limit 1', users.GetCurrentUser() ).get()
		if p != None:
			return p.sortOrder + 1
		return 0
	
	@classmethod
	def GetAllProjectKeys( cls ):
		projects = Project.gql( 'where user = :1', users.GetCurrentUser() )
		return [( p.key() ) for p in projects]
	
	def removeAllTasks( self ):
		# grab the tasks and clean them up
		for task in self.tasks:
			task.removeAllComments()
			task.removeAllImages()
			task.delete()


class Task( BaseModel ):
	user = db.UserProperty( required = True )
	created = db.DateTimeProperty( auto_now_add = True )
	updated = db.DateTimeProperty( auto_now = True )
	sortOrder = db.IntegerProperty( required = True )
	title = db.StringProperty( required = True )
	description = db.TextProperty()
	tags = db.StringListProperty()
	completed = db.BooleanProperty( default = False )
	important = db.BooleanProperty( default = False )
	
	@property
	def comments( self ):
		return Comment.gql( 'where ancestor is :1', self )
		
	@property
	def images( self ):
		return Image.gql( 'where ancestor is :1', self )
	
	@classmethod
	def CountAllTasks( cls ):
		# grab a count of all the tasks that are not completed
		return GqlQuery( 'select __key__ from Task where user = :1 and completed = False', users.GetCurrentUser() ).count( 1000 )

	@classmethod
	def AllTasks( cls ):
		# grab all the tasks that arent completed
		return Task.gql( 'where user = :1 and completed = False order by sortOrder', users.GetCurrentUser() ).fetch( 1000 )

	@classmethod
	def AllCompletedTasks( cls ):
		# grab all the completed tasks
		return Task.gql( 'where user = :1 and completed = True', users.GetCurrentUser() ).fetch( 1000 )
	
	@classmethod
	def AllTasksWithTag( cls, tag ):
		# grab all the tasks with a given tag
		return Task.gql( 'where user = :1 and tags = :2 and completed = False order by sortOrder', users.GetCurrentUser(), tag ).fetch( 1000 )

	@classmethod
	def AllTasksForProject( cls, project ):
		# grab the task with the highest sort order for the project
		return Task.gql( 'where ancestor is :1 and completed = False order by sortOrder', project ).fetch( 1000 )

	@classmethod
	def CountAllImportantTasks( cls ):
		# grab a count of all the tasks with the important flag
		return GqlQuery( 'select __key__ from Task where user = :1 and important = True and completed = False', users.GetCurrentUser() ).count( 1000 )

	@classmethod
	def AllImportantTasks( cls ):
		# grab all the tasks with the important flag
		return Task.gql( 'where user = :1 and important = True and completed = False', users.GetCurrentUser() ).fetch( 1000 )

	@classmethod
	def NextSortOrderForProject( cls, project ):
		# grab the task with the highest sort order for the project
		t = Task.gql( 'where ancestor is :1 and completed = False order by sortOrder desc limit 1', project ).get()
		if t != None:
			return t.sortOrder + 1
		return 0

	def toDict( self ): # override to pass along the parent as a key and the projectName
		dic = BaseModel.toDict( self )
		dic['parent'] = self.parent().key().id()
		dic['projectName'] = self.parent().name
		dic['tags'] = self.tags
		return dic
	
	def removeAllComments( self ):
		# grab the comments and kill them all
		for comment in self.comments:
			comment.delete()
	
	def removeAllImages( self ):
		# grab all the images and remove them
		for image in self.images:
			image.delete()


class Comment( BaseModelWithFather ):
	created = db.DateTimeProperty( auto_now_add = True )
	text = db.TextProperty()


class Image( db.Model ):
	filename = db.StringProperty( required = True )
	image = db.BlobProperty( required = True, default = None )

	def toDict( self ):
		task = self.parent()
		dict = {
			'filename': self.filename,
			'id': self.key().id(),
			'url': '/images/get/%s/%s/%s' % ( task.parent().key().id(), task.key().id(), self.key().id() )
		}
		return dict

