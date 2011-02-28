function Project(){ return this; }
Project.prototype = {
	id: null,
	created: null,
	name: null,
	
	fromJson: function( json )
	{
		Object.merge( this, json );
		return this;
	}
};

// completionhandler should take 2 params: projects, tags
Project.loadProjects = function( completionHandler, failedHandler )
{
	var jsonRequest = new Request.JSON
	({
		url: '/projects',
		noCache: true,
		onSuccess: function( res )
		{
			// convert our projects
			var projects = [];
			
			res.projects.each( function( item )
			{
				var p = new Project().fromJson( item );
				projects.push( p );
			});
			completionHandler( projects, res.tags );
			
			main.alert( 'Projects loaded' );
		},
		onFailure: failedHandler
	}).get();
	
	return jsonRequest;
};


// complete takes in a project
Project.add = function( projectName, complete )
{
	var jsonRequest = new Request.JSON
	({
		url: '/projects/add',
		onSuccess: function( res )
		{
			if( res.result )
			{
				// reload everything
				Project.loadProjects( main.projectsLoaded, main.projectLoadFailed );
				
				var p = new Project().fromJson( res.data );
				complete( p );
				main.alert( 'New project added' );
			}
			else
			{
				alert( res.error );
			}
		},
		onFailure: function( xhr )
		{
			alert( 'Adding a new project failed' );
		}
	}).post({ projectName: projectName });
	
	return jsonRequest;
};


// order should be an array of objects: [{ id: 1, sortOrder: 3 }]
Project.setSortOrder = function( order )
{
	var params = { 'order': JSON.encode( order ) };

	var jsonRequest = new Request.JSON
	({
		url: '/projects/reorder',
		onSuccess: function( res )
		{
			if( !res.result )
				alert( res.error );
			else
				main.alert( 'Sort order saved' );
		},
		onFailure: function( xhr )
		{
			alert( 'Setting project sort order failed' );
		}
	}).post( params );
	
	return jsonRequest;
};

// renames the project
Project.rename = function( projectId, name )
{
	var params = { projectId: projectId, projectName: name };

	var jsonRequest = new Request.JSON
	({
		url: '/projects/rename',
		onSuccess: function( res )
		{
			if( !res.result )
			{
				alert( res.error );
			}
			else
			{
				// reload everything
				Project.loadProjects( main.projectsLoaded, main.projectLoadFailed );
				main.alert( 'Project renamed' );
			}
		},
		onFailure: function( xhr )
		{
			alert( 'Setting project sort order failed' );
		}
	}).post( params );
	
	return jsonRequest;
};


// removes the project
Project.remove = function( projectId )
{
	var params = { projectId: projectId };

	var jsonRequest = new Request.JSON
	({
		url: '/projects/remove',
		onSuccess: function( res )
		{
			if( !res.result )
			{
				alert( res.error );
			}
			else
			{
				// reload everything
				Project.loadProjects( main.projectsLoaded, main.projectLoadFailed );
				main.alert( 'Project removed' );
			}
		},
		onFailure: function( xhr )
		{
			alert( 'Setting project sort order failed' );
		}
	}).post( params );
	
	return jsonRequest;
};


// ########### Tasks #############
function Task(){ return this; }
Task.prototype = {
	id: null,
	parent: null,
	created: null,
	updated: null,
	title: null,
	description: null,
	important: null,
	completed: null,
	projectName: null,
	tags: null,
	
	fromJson: function( json )
	{
		Object.merge( this, json );
		
		// fix the bools
		this.important = this.important == 'True';
		this.completed = this.completed == 'True';
		
		return this;
	}
};

Task.getTasksForProjectIdOrTag = function( projectIdOrTag, complete, failed )
{
	// do we have a projectId or a tag?
	var isProject = typeOf( projectIdOrTag ) == 'number';
	var params = isProject ? { 'projectId': projectIdOrTag } : { 'tag': projectIdOrTag };
	
	var jsonRequest = new Request.JSON
	({
		url: '/tasks/getForProjectOrTag',
		noCache: true,
		onSuccess: function( res )
		{
			// convert our tasks
			var tasks = [];
			
			res.each( function( item )
			{
				var t = new Task().fromJson( item );
				tasks.push( t );
			});
			complete( tasks );
			
			main.alert( 'Tasks retrieved' );
		},
		onFailure: failed
	}).get( params );
	
	return jsonRequest;
};


Task.getAllCompleted = function( complete, failed )
{
	var jsonRequest = new Request.JSON
	({
		url: '/tasks/getAllCompleted',
		noCache: true,
		onSuccess: function( res )
		{
			// convert our tasks
			var tasks = [];
			
			res.each( function( item )
			{
				var t = new Task().fromJson( item );
				tasks.push( t );
			});
			complete( tasks );
			
			main.alert( 'Tasks retrieved' );
		},
		onFailure: failed
	}).get();
	
	return jsonRequest;
};


Task.remove = function( taskId, projectId )
{
	var jsonRequest = new Request.JSON
	({
		url: '/tasks/remove',
		onSuccess: function( res )
		{
			if( !res.result )
			{
				alert( res.error );
			}
			else
			{
				main.tasks.reload();
				main.alert( 'Task removed' );
			}
		},
		onFailure: function( xhr )
		{
			alert( 'Setting tag sort order failed' );
		}
	}).post( { taskId: taskId, projectId: projectId } );
	
	return jsonRequest;
};


Task.markImportant = function( taskId, projectId, isImportant )
{
	var jsonRequest = new Request.JSON
	({
		url: '/tasks/important',
		onSuccess: function( res )
		{
			if( !res.result )
				alert( res.error );
			else
				main.alert( 'Task flag state saved' );
		},
		onFailure: function( xhr )
		{
			alert( 'Setting tag sort order failed' );
		}
	}).post( { taskId: taskId, projectId: projectId, important: isImportant } );
	
	return jsonRequest;
};


Task.markComplete = function( taskId, projectId, isComplete )
{
	var jsonRequest = new Request.JSON
	({
		url: '/tasks/completed',
		onSuccess: function( res )
		{
			if( !res.result )
				alert( res.error );
			else
				main.alert( 'Task complete state saved' );
		},
		onFailure: function( xhr )
		{
			alert( 'Setting tag sort order failed' );
		}
	}).post( { taskId: taskId, projectId: projectId, completed: isComplete } );
	
	return jsonRequest;
};


// order should be an array of objects: [{ id: 1, sortOrder: 3 }]
Task.setSortOrder = function( order, projectId )
{
	var params = { 'order': JSON.encode( order ), projectId: projectId };

	var jsonRequest = new Request.JSON
	({
		url: '/tasks/reorder',
		onSuccess: function( res )
		{
			if( !res.result )
				alert( res.error );
			else
				main.alert( 'Task sort order saved' );
		},
		onFailure: function( xhr )
		{
			alert( 'Setting task sort order failed' );
		}
	}).post( params );
	
	return jsonRequest;
};

// adds a new task and passes it back to the complete method
Task.addNew = function( projectId, title, description, tags, complete )
{
	var params = { projectId: projectId, title: title, description: description, tags: JSON.encode( tags ) };

	var jsonRequest = new Request.JSON
	({
		url: '/tasks/add',
		onSuccess: function( res )
		{
			if( !res.result )
			{
				alert( res.error );
			}
			else
			{
				complete( new Task().fromJson( res.data ) );
				main.alert( 'New task added' );
			}
		},
		onFailure: function( xhr )
		{
			alert( 'Adding new task failed' );
		}
	}).post( params );
	
	return jsonRequest;
};


// ########### Tags #############
var Tags = {};
Tags.setSortOrder = function( tags )
{
	var params = { 'tags': JSON.encode( tags ) };
	
	var jsonRequest = new Request.JSON
	({
		url: '/tags/reset',
		onSuccess: function( res )
		{
			if( !res.result )
				alert( res.error );
			else
				main.alert( 'Tag sort order saved' );
		},
		onFailure: function( xhr )
		{
			alert( 'Setting tag sort order failed' );
		}
	}).post( params );
	
	return jsonRequest;
};

Tags.add = function( tag )
{
	var params = { tag: tag };
	
	var jsonRequest = new Request.JSON
	({
		url: '/tags/add',
		onSuccess: function( res )
		{
			if( !res.result )
			{
				alert( res.error );
			}
			else
			{
				main.tags.clearTags();
				main.tags.addTags( res.data );
				main.alert( 'Tag added' );
			}
		},
		onFailure: function( xhr )
		{
			alert( 'Setting tag sort order failed' );
		}
	}).post( params );
	
	return jsonRequest;
};

Tags.rename = function( oldTag, newTag )
{
	var params = { oldTag: oldTag, newTag: newTag };
	
	var jsonRequest = new Request.JSON
	({
		url: '/tags/rename',
		onSuccess: function( res )
		{
			if( !res.result )
			{
				alert( res.error );
			}
			else
			{
				main.tags.clearTags();
				main.tags.addTags( res.data );
				main.tasks.reload();
				main.alert( 'Tag renamed' );
			}
		},
		onFailure: function( xhr )
		{
			alert( 'Setting tag sort order failed' );
		}
	}).post( params );
	
	return jsonRequest;
};

Tags.remove = function( tag )
{
	var params = { tag: tag };
	
	var jsonRequest = new Request.JSON
	({
		url: '/tags/remove',
		onSuccess: function( res )
		{
			if( !res.result )
			{
				alert( res.error );
			}
			else
			{
				main.tags.clearTags();
				main.tags.addTags( res.data );
				main.tasks.reload();
				main.alert( 'Tag removed' );
			}
		},
		onFailure: function( xhr )
		{
			alert( 'Setting tag sort order failed' );
		}
	}).post( params );
	
	return jsonRequest;
};
