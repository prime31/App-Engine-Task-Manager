main.projects = {
	/* events
		selectedProjectChanged( tag ),
		projectsUpdated( projects )
	*/
	
	items: [],
	
	init: function()
	{
		this.ele = $( 'projectList' );
		
		// make the list sortable
		this.list = new SortableList( this.ele );
		this.list.addEvent( 'onSortOrderChanged', main.projects.onProjectSortChanged );
		
		// listen for clicks on the settings modifier inside the li's
		this.ele.addEvent( 'click:relay(li ins)', this.onEditProjectClicked );

		// listen for clicks on the li's
		this.ele.addEvent( 'click:relay(li)', this.onListItemClicked );
	},
	
	onEditProjectClicked: function( evt, ele )
	{
		evt.stop();
		
		var projectId = ele.getParent( 'li' ).getAttribute( 'data-id' );
		var p = main.projects.getProjectForProjectId( projectId );
		if( p )
			prompts.configureProject( p );
	},
	
	onProjectSortChanged: function( ele )
	{
		var order = [];
		ele.list.getChildren( 'li:not(li.dragging)' ).each( function( item, i )
		{
			order.push( { id: parseInt( item.getAttribute( 'data-id' ) ), sortOrder: i } );
		});
		
		Project.setSortOrder( order );
	},
	
	onListItemClicked: function( evt, ele )
	{
		evt.stop();

		// bail out if we are in the process of being sorted. clicks don't count then
		if( ele.retrieve( 'sortChanged' ) )
			return;
						
		// dont do anything for clicks on the ins or selected li's
		if( evt.target.get( 'tag' ) == 'ins' || ele.hasClass( 'selected' ) )
			return;
		
		main.deselectProjectAndTag();
		ele.addClass( 'selected' );
		
		var projectId = ele.get( 'data-id' );
		var project = main.projects.getProjectForProjectId( projectId );
		
		main.fireEvent( 'selectedProjectChanged', project );
	},
	
	// takes in a single project or multiple
	addProjects: function( projects )
	{
		Array.from( projects ).each( function( project )
		{
			main.projects.items.push( project );
			
			// grab our template, stick the tag in and inject it into the dom
			var template = document.id( 'tagAndProjectTemplate' ).getChildren()[0].clone();
			template.getElement( 'div' ).set( 'html', project.name );
			template.inject( main.projects.ele );
			
			// allow the item to be sorted
			main.projects.list.addItems( template );
			
			// store the project id in the li
			template.setAttribute( 'data-id', project.id );
		});
		
		main.fireEvent( 'projectsUpdated', main.projects.items );
		main.layout();
	},
	
	getProjectForProjectId: function( projectId )
	{
		for( var i = 0; i < main.projects.items.length; i++ )
		{
			if( main.projects.items[i].id == projectId )
				return main.projects.items[i];
		}
		
		return null;
	},
	
	getProjectForName: function( name )
	{
		for( var i = 0; i < main.projects.items.length; i++ )
		{
			if( main.projects.items[i].name == name )
				return main.projects.items[i];
		}
		
		return null;
	},

	// removes all tasks
	clearProjects: function()
	{
		main.projects.removeProjects( this.ele.getChildren( 'li' ) );
	},
	
	// projects can be an array or single element (this is the li elements!)
	removeProjects: function( projects )
	{
		var projects = Array.from( projects );
		
		projects.each( function( item )
		{
			var id = item.getAttribute( 'data-id' );
			
			for( var i = 0; i < main.projects.items.length; i++ )
			{
				if( main.projects.items[i].id == id )
				{
					main.projects.items.splice( i, 1 );
					break;
				}
			}
		});
		
		main.projects.list.removeItems( projects ).destroy();
	},
}