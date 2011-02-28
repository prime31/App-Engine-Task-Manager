var MooScroll = new Class
({
	initialize: function( bar, handle, content )
	{
		this.bar = document.id( bar );
		this.handle = document.id( handle );
		this.content = document.id( content );

		this.update();
	},
	
	construct: function( steps )
	{
		this.slider = new Slider( this.bar, this.handle,
	    {
			mode: 'vertical',
			steps: steps,
			onChange: function( step )
			{
				// Scrolls the content element in x or y direction.
				var y = step;
				this.content.scrollTo( 0, y );
			}.bind( this )
		}).set( 0 );

		// Scroll the content element when the mousewheel is used within the content or the scrollbar element.
		$$( this.content, this.bar ).addEvent( 'mousewheel', function( e )
		{
			e.stop();
			var step = this.slider.step - e.wheel * 10;
			
			// clamp the step
			step = Math.max( 0, Math.min( this.slider.steps, step ) );
			
			this.slider.set( step );					
		}.bind( this ));

		// Stops the handle dragging process when the mouse leaves the document body.
		$( document.body ).addEvent( 'mouseleave', function(){ this.slider.drag.stop() }.bind( this ));
	},
	
	// this should be called whenever the content changes
	update: function()
	{
		var scrollSize = this.content.getFirst().getScrollSize().y;
		var contentHeight = this.content.getComputedSize().height;
		
		// hide the scroll bar if we dont need it
		if( this.content.getSize().y >= scrollSize )
			this.bar.addClass( 'hide' );
		else
			this.bar.removeClass( 'hide' );
		
		// fix up our handle
		var handleHeight = contentHeight * ( contentHeight / scrollSize );
		this.handle.setStyle( 'height', handleHeight );
		
		// size the bar properly
		this.bar.setStyle( 'height', contentHeight );
		
		var steps = scrollSize - contentHeight;
		this.construct( steps );
	}
});