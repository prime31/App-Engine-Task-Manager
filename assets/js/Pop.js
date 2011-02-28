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
			
			if( !main.pop.newTaskOvertextSetup )
			{
				// setup overtext
				$$( 'input[alt]', 'textarea[alt]' ).each( function( ele )
				{
					new OverText( ele, { poll: true } );
				});
				main.pop.newTaskOvertextSetup = true;
			}
			
			$( 'taskPopover' ).removeClass( 'hide' );
			main.pop.resetNewTaskForm();
		});
		
		// new task popover events
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
		
		// activate the save button when we have proper key up
		$( 'taskPopover' ).getElement( '#newTaskTitle' ).addEvent( 'keyup', main.pop.validateNewTask );
		$( 'taskPopover' ).getElement( '#newTaskProject' ).addEvent( 'keyup', main.pop.validateNewTask );

		// textarea expander
		new DynamicTextarea( 'newTaskNotes' );
		
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
		
		var project = main.projects.getProjectForName( projectName );
		
		// do we need to add a new project first?
		if( project != null )
		{
			Task.addNew( project.id, title, description, tags, function( newTask )
			{
				// add the tags in case there are new ones
				main.tags.addTags( newTask.tags );
				
				// only add the task if it is currently in a list that is showing
				if( main.tasks.currentProjectIdOrTag == project.id || tags.contains( main.tasks.currentProjectIdOrTag ) )
					main.tasks.addTasks( newTask );
			});
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
		$( 'taskForm' ).reset();
		
		$$( '#taskPopover input, #taskPopover textarea' ).retrieve( 'OverText' ).each( function( item )
		{
		    if( item != null )
		        item.show();
		});
		
		// clean up the state of the save button
		main.pop.validateNewTask();
		
		if( shouldHide )
			$( 'taskPopover' ).addClass( 'hide' );
	}

}