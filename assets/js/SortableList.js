var SortableList = new Class
({	
	Extends: Sortables,
	
	Implements: [Options],
	
	options: {
		/* sortOrderChanged: function( this ) */
		revert: { duration: 500, transition: 'quad:out' },
		clone: true,
		opacity: 0.5,
		snap: 10,
		constrain: true,
		dragOptions: {
			onBeforeStart: function( ele )
			{
				ele.addClass( 'dragging' );
			}
		},
		onSort: function( ele, clone )
		{
			ele.store( 'sortChanged', true );
		},
		onComplete: function( ele )
		{
			// did the sort order change?
			if( ele.retrieve( 'sortChanged' ) )
			{
				// eliminate the element store value after 500 ms.  this will give the click event time to fire and not count
				setTimeout( function()
				{
					this.fireEvent( 'sortOrderChanged', this );
					ele.eliminate( 'sortChanged' );
				}.bind( this ), 500 );
			}
		}	
	},
	
	initialize: function( ele, options )
	{
		this.setOptions( options );
		this.parent( ele, this.options );
	}
});