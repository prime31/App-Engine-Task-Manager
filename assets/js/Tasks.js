main.tasks = {
	items: [],
	request: null,
	taskTitle: null,
	taskTitleWrapper: null,
	currentProjectIdOrTag: null,
	
	init: function()
	{
		// save off some elements for later use
		this.taskTitleWrapper = document.id( 'main' ).getElement( 'h3.project' );
		this.taskTitle = document.id( 'main' ).getElement( 'span.title' );
		
		this.ele = $( document.body ).getElement( 'ul.taskList' );
	
		// make the task list sortable	
		this.list = new SortableList( this.ele );
		this.list.addEvent( 'onSortOrderChanged', this.onTaskSortChanged );
		
		// listen for clicks on the list tag buttons
		this.ele.addEvent( 'click:relay(ul.tags li a)', this.onClickTag );
		
		// listen for clicks on the list right action buttons
		this.ele.addEvent( 'click:relay(ul.task-actions li a)', this.onClickActionButton );
		
		// listen for clicks on the actual tasks
		this.ele.addEvent( 'click:relay(a.newTask)', function( evt, ele )
		{
			evt.stop();
			
			// grab the task and show the comments screen
			var taskId = parseInt( ele.getParent( 'li[data-id]' ).getAttribute( 'data-id' ) );
			var task = main.tasks.getTaskForTaskId( taskId );
			main.comments.showTaskDetails( taskId, task.parent );
		});
		
		// listen to checkbox changes
		this.ele.addEvent( 'click:relay(ul.taskList input[type=checkbox])', this.onClickCheckbox );
		
		// listen for clicks on the show completed button
		$( 'showCompletedLink' ).addEvent( 'click', function( evt )
		{
			evt.stop();
			
			// clear out our comments if we are showing them
			main.comments.hideTaskDetails();
			
			main.deselectProjectAndTag();
			main.tasks.clearTasks();
			main.tasks.loadAllCompletedTasks();
		});
		
		// listen to changes to tags and projects
		main.addEvent( 'selectedTagChanged', main.tasks.onTagChanged );
		
		main.addEvent( 'selectedProjectChanged', main.tasks.onProjectChanged );
	},
	
	loadTasksForProjectIdOrTag: function( projectIdOrTag )
	{
		main.tasks.currentProjectIdOrTag = projectIdOrTag
		
		// cancel any currently running request
		if( main.tasks.request )
			main.tasks.request.cancel;
		main.tasks.request = Task.getTasksForProjectIdOrTag( projectIdOrTag, main.tasks.tasksLoaded, main.tasks.taskLoadFailed );
	},
	
	loadAllCompletedTasks: function()
	{
		// hide the 'show completed' link
		$( 'showCompletedLink' ).addClass( 'hide' );
		main.tasks.setTitle( 'Completed Tasks' );
		
		// cancel any currently running request
		if( main.tasks.request )
			main.tasks.request.cancel;
		main.tasks.request = Task.getAllCompleted( main.tasks.tasksLoaded, main.tasks.taskLoadFailed );
	},
	
	// request event handlers
	tasksLoaded: function( tasks )
	{
		main.tasks.request = null;
		main.tasks.addTasks( tasks );
	},
	
	taskLoadFailed: function( xhr )
	{
		main.tasks.request = null;
		alert( 'Task load failed' );
	},
	
	onTasksLoaded: function( tasks )
	{
		main.tasks.addTasks( tasks );
	},
	
	// list events
	onTaskSortChanged: function( ele )
	{
		var order = [];
		ele.list.getChildren( 'li:not(li.dragging)' ).each( function( item, i )
		{
			order.push( { id: parseInt( item.getAttribute( 'data-id' ) ), sortOrder: i } );
		});
		
		Task.setSortOrder( order, main.tasks.currentProjectIdOrTag );
	},
	
	onClickTag: function( evt, ele )
	{
		evt.stop();
		
		var tag = ele.get( 'html' );
		main.tasks.onTagChanged( tag );
		main.deselectProjectAndTag();
	},
	
	onTagChanged: function( tag )
	{
		// hide the 'show completed' link
		$( 'showCompletedLink' ).addClass( 'hide' );
		
		// clear out our tags, show the title and start loading
		main.tasks.setTitle( tag );
		main.tasks.clearTasks();
		
		main.tasks.loadTasksForProjectIdOrTag( tag );
	},
	
	onProjectChanged: function( project )
	{
		// show the 'show completed' link
		$( 'showCompletedLink' ).removeClass( 'hide' );
		
		// clear out our tags, show the title and start loading
		main.tasks.setTitle( project.name );
		main.tasks.clearTasks();
		main.tasks.loadTasksForProjectIdOrTag( project.id );
	},
	
	reload: function()
	{
		// reload requires us to make sure that the projectId or tag exists because it may have been deleted
		if( typeOf( main.tasks.currentProjectIdOrTag ) == 'number' )
		{
			var p = main.projects.getProjectForProjectId( main.tasks.currentProjectIdOrTag );
			if( p )
			{
				main.tasks.onProjectChanged( p );
				return;
			}
		}
		else
		{
			if( main.tags.items.contains( main.tasks.currentProjectIdOrTag ) )
			{
				main.tasks.onTagChanged( main.tasks.currentProjectIdOrTag );
				return;
			}
		}
		
		// if we get here we need to clear things out because we were deleted
		main.tasks.setTitle( '' );
		main.tasks.clearTasks();
	},
	
	onClickActionButton: function( evt, ele )
	{
		evt.stop();
		
		switch( ele.get( 'html' ) )
		{
			case 'Flag':
				main.tasks.toggleTaskImportant( ele, true );
				break;
			case 'Edit':
				console.log( 'edit' );
				break;
			case 'Delete':
				var li = ele.getParent( 'li[data-id]' );
				var taskId = li.getAttribute( 'data-id' );
				
				$prompt.show( 'Are you sure you want to delete this task?',
				{
					buttons: { Cancel: false, Delete: true },
					callback: function( v, m, f )
					{
				   		if( v )
						{
							var task = main.tasks.getTaskForTaskId( taskId );
							if( task )
				        		Task.remove( taskId, task.parent );
						}
						return true;
					}
				});
				break;
		}	
	},
	
	toggleTaskImportant: function( a, changeServer )
	{
		// change the li a and also find the other one
		var parent = a.getParent();
		var span = a.getParent( 'ul.task-actions' ).getPrevious().getElement( 'span' );
		
		// are we turning the flag on or off?
		var isFlagOn = parent.hasClass( 'flagOn' );
		
		parent.toggleClass( 'flagOn' )
		span.toggleClass( 'flaggedOn' );

		// grab the li if we need to modify this on the server
		if( changeServer )
		{
			var li = a.getParent( 'li[data-id]' );
			var taskId = li.getAttribute( 'data-id' );
			var task = main.tasks.getTaskForTaskId( taskId );
			task.important = !task.important;

			Task.markImportant( task.id, task.parent, task.important );
		}
	},
	
	onClickCheckbox: function( evt, ele )
	{
		var taskId = ele.getParent( 'li' ).getAttribute( 'data-id' );
		var task = main.tasks.getTaskForTaskId( taskId );
		var complete = ele.checked ? 1 : '';
		
		Task.markComplete( taskId, task.parent, complete )
	},
	
	addTasks: function( tasks )
	{
		var tasks = Array.from( tasks );
		main.tasks.items.combine( tasks );
		
		// we enable task sorting only if we have a projectId
		var allowSort = typeOf( main.tasks.currentProjectIdOrTag ) == 'number';
		
		tasks.each( function( task )
		{
			// grab our template, stick the data in and inject it into the dom
			var template = document.id( 'taskTemplate' ).getChildren()[0].clone();
			template.getElement( 'div > a' ).set( 'html', task.title );
			
			// handle tags
			task.tags.each( function( tag )
			{
				// <li><a>Etcetera</a></li>
				var a = new Element( 'a', { html: tag } );
				var li = new Element( 'li' ).inject( template.getElement( 'ul.tags' ) );
				a.inject( li );
			});
			
			// are we flagged?
			if( task.important )
			{
				var a = template.getElement( 'a[title=Flag]' );
				main.tasks.toggleTaskImportant( a, false );
			}
			
			// are we complete?
			var check = template.getElement( 'input[type=checkbox]' );
			check.checked = task.completed;
			
			template.inject( main.tasks.ele );

			// allow the item to be sorted if they are allowed
			if( allowSort )
			{
				main.tasks.list.addItems( template );
			}
			else // the template needs a project if sort isn't allowed (that means this is a tag)
			{
				template.getElement( 'strong.projectName' ).set( 'html', task.projectName + ':' );
			}
			
			// store the id in the li
			template.setAttribute( 'data-id', task.id );
		});
	},
	
	// removes all tasks
	clearTasks: function()
	{
		main.tasks.currentProjectIdOrTag = null;
		main.tasks.removeTasks( this.ele.getChildren( 'li' ) );
	},
	
	// tasks can be an array or single element
	removeTasks: function( tasks )
	{
		var tasks = Array.from( tasks );
		
		tasks.each( function( item )
		{
			var id = item.getAttribute( 'data-id' );
			
			for( var i = 0; i < main.tasks.items.length; i++ )
			{
				if( main.tasks.items[i].id == id )
				{
					main.tasks.items.splice( i, 1 );
					break;
				}
			}
		});
		
		main.tasks.list.removeItems( tasks ).destroy();
	},
	
	setTitle: function( title )
	{
		main.tasks.taskTitleWrapper.removeClass( 'hide' );
		main.tasks.taskTitle.set( 'html', title );
	},
	
	getTaskForTaskId: function( taskId )
	{
		for( var i = 0; i < main.tasks.items.length; i++ )
		{
			if( main.tasks.items[i].id == taskId )
				return main.tasks.items[i];
		}
		
		return null;
	}

}