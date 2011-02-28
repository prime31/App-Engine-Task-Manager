main.tags = {
	/* events
		selectedTagChanged( tag ),
		tagsUpdated( tags )
	*/
	items: [],
	scrollBar: null,
	
	init: function()
	{
		this.ele = $( 'tagList' );
		
		// make the list sortable
		this.list = new SortableList( this.ele );
		this.list.addEvent( 'onSortOrderChanged', main.tags.onTagSortChanged );
		
		// listen for clicks on the settings modifier inside the li's
		this.ele.addEvent( 'click:relay(li ins)', this.onEditTagClicked );
		
		// listen for clicks on the li's
		this.ele.addEvent( 'click:relay(li)', this.onListItemClicked );	
		
		/* setup the scrollbar */
		var bar = $( 'west' ).getElement( 'div.scrollBar' );
		var handle = $( 'west' ).getElement( 'div.scrollHandle' );
		var content = $( 'tagListWrapper' );

		this.scrollBar = new MooScroll( bar, handle, content );
	},
	
	onTagSortChanged: function( ele )
	{
		var allTags = ele.list.getChildren( 'li > div' ).get( 'html' ).unique();
		Tags.setSortOrder( allTags );
	},
	
	onEditTagClicked: function( evt, ele )
	{
		evt.stop();
		
		var tag = ele.getParent( 'li' ).retrieve( 'tag' );
		prompts.configureTag( tag );
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
		
		var tag = ele.retrieve( 'tag' );
		main.setTitle( 'Tag: ' + tag );
		main.fireEvent( 'selectedTagChanged', tag );
	},
	
	// removes all tasks
	clearTags: function()
	{
		main.tags.list.removeItems( main.tags.ele.getChildren( 'li' ) ).destroy();
		main.tags.items = [];
	},
	
	addTags: function( tags )
	{
		Array.from( tags ).each( function( tag )
		{
			// keep stock of our tags
			main.tags.items.include( tag );
			
			// grab our template, stick the tag in and inject it into the dom
			var tagTemplate = document.id( 'tagAndProjectTemplate' ).getChildren()[0].clone();
			tagTemplate.getElement( 'div' ).set( 'html', tag );
			tagTemplate.inject( main.tags.ele );
			
			// allow the item to be sorted
			main.tags.list.addItems( tagTemplate );
			
			// store the tag in the li
			tagTemplate.store( 'tag', tag );
		});
		
		// update the scroll bar and fire off the tagsUpdated event
		main.tags.scrollBar.update();
		main.fireEvent( 'tagsUpdated', main.tags.items );
	}

}
