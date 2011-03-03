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
from Tags import *
from Projects import *
from Tasks import *
from Comments import *
from Images import *


class MainHandler( webapp.RequestHandler ):
	@login_required
	def get( self ):
		uastring = self.request.headers.get( 'user_agent' )
		logging.error( uastring )

		if "Mobile" in uastring:
			self.response.out.write( template.render( 'index-mobile.html', None ) )
			logging.error( 'serving MOBILE index' )
		else:
			self.response.out.write( template.render( 'index.html', None ) )


class DataTester( webapp.RequestHandler ):
	@login_required
	def get( self ):
		self.response.out.write( template.render( 'kill.html', None ) )





def main():
    application = webapp.WSGIApplication( [ ( '/', MainHandler ),
											( '/tags/reset', ResetTags ),
											( '/tags/add', AddTag ),
											( '/tags/remove', RemoveTag ),
											( '/tags/rename', RenameTag ),
											( '/tags/removeUnused', RemoveUnusedTags ),
	
											( '/projects', GetProjects ),
											( '/projects/add', AddProject ),
											( '/projects/reorder', ReorderProjects ),
											( '/projects/rename', RenameProject ),
											( '/projects/remove', RemoveProject ),
											
											( '/tasks/getForProjectOrTag', GetTasksForProjectOrTag ),
											( '/tasks/getAllCompleted', GetAllCompletedTasks ),
											( '/tasks/get', GetTask ),
											( '/tasks/add', AddTask ),
											( '/tasks/reorder', ReorderTasks ),
											( '/tasks/edit', EditTask ),
											( '/tasks/remove', RemoveTask ),
											( '/tasks/completed', FlagTaskCompleted ),
											( '/tasks/important', FlagTaskImportant ),
											
											( '/comments/add', AddComment ),
											( '/comments/remove', RemoveComment ),
											
											( '/images/get/(\d+)/(\d+)/(\d+)', GetImage ),
											( '/images/add', AddImage ),
											( '/images/remove', RemoveImage ),
											
										    ( '/tester', DataTester ) ],
											debug = True )
    util.run_wsgi_app( application )


if __name__ == '__main__':
    main()
