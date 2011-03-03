main.pop = {
	newTaskOvertextSetup: false,
	
	init: function()
	{
		this.setupNewTaskForm();
		this.setupSearchBox();
		
		// listen to some events to keep the autocompletes up to date
		main.addEvent( 'tagsUpdated', function( tags )
		{
			// update the autocompleter
			main.pop.tagAutocompleter.tokens = main.tags.items;
		});
		
		main.addEvent( 'projectsUpdated', function( projects )
		{
			// update the autocompleter
			var names = [];
			main.projects.items.each( function( p )
			{
			    names.push( p.name );
			});
			
			main.pop.projectAutocompleter.tokens = names;
		});
	},
	
	setupSearchBox: function()
	{
		$( 'searchPopover' ).getElement( 'button.cancel' ).addEvent( 'click', function( evt )
		{
			$( 'searchPopover' ).addClass( 'hide' );
		});
		
		$( 'header' ).getElement( 'input.query' ).addEvents
		({
			focus: function( evt )
			{
				$( 'searchPopover' ).removeClass( 'hide' );
			},
			keyup: function( evt )
			{
				
			}
		});
		
		// clear search on click
		$( 'header' ).getElement( 'a.clear-search' ).addEvent( 'click', function( evt )
		{
			evt.stop();
			evt.target.getParent().getPrevious( 'input' ).value = '';
		});
	},
	
	setupNewTaskForm: function()
	{
		// new task button
		$( 'header' ).getElement( 'a.newTask' ).addEvent( 'click', function( evt )
		{
			evt.stop();
			
			main.pop.showNewEditTaskForm( evt.target );
		});
		
		// new task popover events: clear buttons
		$( 'taskPopover' ).addEvent( 'click:relay(span.clear-this)', function( evt, ele )
		{
			var input = ele.getPrevious( 'input', 'textarea' );
			
			// the textarea request a bit more work
			if( !input )
				input = ele.getPrevious( 'div textarea' );
				
			input.value = '';
			
			var over = input.retrieve( 'OverText' );
			if( over )
				over.show();
			
			main.pop.validateNewTask();
		});
		
		// cancel button
		$( 'taskPopover' ).getElement( 'button.cancel' ).addEvent( 'click', function( evt )
		{
			main.pop.resetNewTaskForm( true );
		});
		
		// save button
		$( 'taskPopover' ).getElement( 'button.right' ).addEvent( 'click', function( evt )
		{
			if( evt.target.getAttribute( 'disabled' ) != null )
				return;
			main.pop.onClickSaveTask();
		});
		
		// put our mask in there
		main.pop.mask = new Mask( document.body, { hideOnClick: true, maskMargins: true } );
		main.pop.mask.addEvent( 'click', function( evt )
		{
			main.pop.resetNewTaskForm( true );
		});
		
		// activate the save button when we have proper key up
		$( 'taskPopover' ).getElement( '#newTaskTitle' ).addEvent( 'keyup', main.pop.validateNewTask );
		$( 'taskPopover' ).getElement( '#newTaskProject' ).addEvent( 'keyup', main.pop.validateNewTask );

		// textarea expander
		main.pop.dynamicText = new DynamicTextarea( 'newTaskNotes' );
		
		// setup our autocomplteres
		this.tagAutocompleter = new Autocompleter.Local( 'newTaskTags', [],
		{
			minLength: 1,
			markQuery: false,
			selectMode: 'type-ahead',
			multiple: true,
			maxChoices: 5,
			relative: false,
			zIndex: 1000,
			filterSubset: true
		});
		
		this.projectAutocompleter = new Autocompleter.Local( 'newTaskProject', [],
		{
			minLength: 1,
			markQuery: false,
			selectMode: 'type-ahead',
			maxChoices: 5,
			zIndex: 1000,
			filterSubset: true
		});
	},
	
	// if task is a Task then this will be an edit window
	showNewEditTaskForm: function( relativeTo, task )
	{
		// setup overtext only once
		if( !main.pop.newTaskOvertextSetup )
		{
			// setup overtext
			$$( 'input[alt]', 'textarea[alt]' ).each( function( ele )
			{
				new OverText( ele, { poll: true } );
			});
			main.pop.newTaskOvertextSetup = true;
		}

		var pop = $( 'taskPopover' );
		pop.removeClass( 'hide' );
		pop.position( { relativeTo: relativeTo, offset: { x: 0, y: 105 } });
		
		// show the mask
		main.pop.mask.show();
		
		// if we have a task, we do things a bit differently becasue we are editing
		var title = task ? 'Edit Task' : 'New Task';
		pop.getElement( 'h2.title' ).set( 'html', title );
		
		if( task )
		{
			main.pop.task = task;
			
			// hide the project
			pop.getElement( 'li.task-project' ).hide();
			
			var title = $( 'newTaskTitle' ).value = task.title;
			var projectName = $( 'newTaskProject' ).value = task.projectName;
			var tags = $( 'newTaskTags' ).value = task.tags.join( ', ' );
			var description = $( 'newTaskNotes' ).value = task.description;
			
			main.pop.dynamicText.checkSize();
			main.pop.validateNewTask();
		}
		
		pop.position( { relativeTo: relativeTo, offset: { x: 0, y: 105 } });
		main.pop.resetNewTaskForm();
	},
	
	validateNewTask: function()
	{
		if( $( 'newTaskTitle' ).value.length && $( 'newTaskProject' ).value.length )
		{
			$( 'taskPopover' ).getElement( 'button.right' ).removeProperty( 'disabled' ).removeClass( 'disabled' );
			return true;
		}
		else
		{
			$( 'taskPopover' ).getElement( 'button.right' ).setProperty( 'disabled', '' ).addClass( 'disabled' );
		}
		
		return false;
	},
	
	onClickSaveTask: function()
	{
		if( !main.pop.validateNewTask() )
			return;
		
		var title = $( 'newTaskTitle' ).value.trim();
		var projectName = $( 'newTaskProject' ).value.trim();
		var tags = $( 'newTaskTags' ).value.trim().split( ',' ).invoke( 'trim' ).filter( function( i ) { return i.length; } );
		var description = $( 'newTaskNotes' ).value.trim();
		
		var isEditing = main.pop.task != null;
		var project = main.projects.getProjectForName( projectName );

		// sanity check
		if( isEditing && project == null )
		{
			alert( 'Something bad happened.  We couldn\'t find the project you are editing' );
			return;
		}
		
		// do we need to add a new project first?
		if( project != null )
		{
			var func = isEditing ? Task.editTask : Task.addNew;
			var args = [project.id, title, description, tags, function( newTask )
			{
				// add the tags in case there are new ones
				main.tags.addTags( newTask.tags );
				
				// only add the task if it is currently in a list that is showing
				if( isEditing )
				{
					main.comments.hideTaskDetails();
					main.tasks.reload();
					return;
				}
				
				if( main.tasks.currentProjectIdOrTag == project.id || tags.contains( main.tasks.currentProjectIdOrTag ) )
					main.tasks.addTasks( newTask );
			}];
			
			// splice in the taskId if we are editing
			if( isEditing )
				args.splice( 0, 0, main.pop.task.id );
			
			func.apply( null, args );
		}
		else
		{
			Project.add( projectName, function( p )
			{
				Task.addNew( p.id, title, description, tags, function( newTask )
				{
					// add the tags in case there are new ones
					main.tags.addTags( newTask.tags );
					
					// only add the task if it is currently in a list that is showing
					if( main.tasks.currentProjectIdOrTag == p.id || tags.contains( main.tasks.currentProjectIdOrTag ) )
						main.tasks.addTasks( newTask );
				});
			});
		}
		
		main.pop.resetNewTaskForm( true );
	},
	
	resetNewTaskForm: function( shouldHide )
	{
		$( 'taskPopover' ).getElement( 'li.task-project' ).show()
		main.pop.task = null;
		main.pop.mask.hide();
		$( 'taskForm' ).reset();
		main.pop.dynamicText.checkSize();
		
		$$( '#taskPopover input, #taskPopover textarea' ).retrieve( 'OverText' ).each( function( item )
		{
		    if( item != null )
		    {
				item.show();
				item.reposition();
			}
		});
		
		// clean up the state of the save button
		main.pop.validateNewTask();
		
		if( shouldHide )
			$( 'taskPopover' ).addClass( 'hide' );
	}

}