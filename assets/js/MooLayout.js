
var MooLayout = new Class
({
    Implements: Events,

    initialize: function( ele )
    {
        this.element = $( ele );

        // look up some elements, and cache the findings
        this.column = this.element.getElement( '.mooLayoutColumn' );
        this.windows = this.element.getElements( '.mooLayoutWindow' );
        this.handle = this.element.getElement( '#mooLayoutHandle' );

        this.render();
    },


    render: function()
    {
        window.addEvent( 'resize', this.resize.bind( this ) );

        // resize
        this.resize();
        this.resize.bind( this ).delay( 20 );

        // change behaviour for IE
        if( !Browser.Engine.trident4 )
            this.createDragInstances();

        // send an event
        this.fireEvent( 'ready' );
    },


    createDragInstances: function()
    {
        var onDrag = function( h )
        {
            var top = ( h.getPosition( this.element ).y + h.getHeight() / 2 ) / this.element.getHeight() * 100;
            this.windows[0].setStyle( 'height', top + '%' );
            this.windows[1].setStyle( 'height', 100 - top + '%' );

			this.fireEvent( 'resize' );
        }.bind( this );

        this.handle.makeResizable
        ({
            modifiers: { x: null, y: 'top' },
            limit:
            {
                y: [-6, this.element.getHeight()]
            },
            onDrag: onDrag
        });

        this.resize();
    },


    resize: function( e )
    {
        var win_size = window.getSize();
        var av_height = win_size.y -
                        //this.column.getPosition().y +
                        this.windows[0].getPosition().y +
                        this.windows[0].getStyle( 'top' ).toInt() +
                        this.windows[1].getStyle( 'bottom' ).toInt();

        this.element.setStyle( 'height', av_height );

        // set handler positions
        this.handle.setStyle( 'top', this.windows[0].getCoordinates( this.element ).bottom );

        this.fireEvent( 'resize' );
    }

});



/*
var layout = new MooLayout( 'mooLayoutContent' );


<div id="mooLayoutContent">
    <div class="mooLayoutWindow mooLayoutTop">CONTENT</div>

    <div id="mooLayoutHandle"></div>

    <div class="mooLayoutWindow mooLayoutBottom">CONTENT</div>
</div>
*/