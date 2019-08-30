class CodeGlory extends BreakDown {

    constructor(el, options) {
        super(el, options);
    }

    ready() {
        if ( !this.status.has('changed') ) {
            this.updateOffsets();
            this.extractSvg('filters.svg');
            this.addFx();
            this.vignette();
        }
        if ( this.status.has('content-changed') ) {
            //this.updateFromParams();
        }

        this.updateWidthFromContent('pre code');
        this.centerView();
        this.registerAppEvents();
        this.updateSliderValue( 'outer-space', this.settings.getValue('outer-space') );
        this.centerView();
    }

    updateWidthFromContent(el) {
        let w = 0;
        let code = this.wrapper.querySelector('pre code');
        if ( code === null ) return;
        code = code.textContent;
        code.split('\n').forEach( l => {
            if ( l.length > w ) w = l.length + 1;
        });
        // update width slider
        this.updateSliderValue('width', w);
    }

    extractSvg(filename) {
        let svg = document.querySelector('#svg');
        if ( svg === undefined ) return;
        let svgFilter = this.settings.getParamValue('svg-filter');
        if ( svgFilter === undefined ) svgFilter = 'none';
        this.get(filename).then( data => {
            // add svg filters to body
            var div = document.createElement("div");
            div.id = 'svg';
            div.innerHTML = data;
            document.body.insertBefore(div, document.body.childNodes[0]);

            let select = this.wrapper.querySelector('.nav .select.svg-filter select');
            if ( select !== null ) {
                let filters = document.querySelectorAll('#svg defs filter');
                filters.forEach( i => {
                    var id = i.getAttribute('id');
                    var name = i.getAttribute('inkscape:label');
                    select.innerHTML += `<option>${name}-${id}</option>`;
                });
            }
            select.value = svgFilter;
            this.updateField(select, svgFilter);
            this.svgChange();
        }).catch(function (error) {
            console.log(error);
        });
    }

    addFx() {
        // check if fx layer already exists and return if so
        if ( this.wrapper.querySelector('.fx') === undefined ) return;
        const fx = document.createElement('div');
        fx.classList.add('fx');
        // wrap inner div with fx div
        const inner = document.querySelector(this.eidInner);
        inner.parentNode.insertBefore(fx, inner);
        fx.appendChild(inner);
        // add vignette layer to wrapper
        const vignette = document.createElement('div');
        vignette.classList.add('vignette-layer');
        this.wrapper.appendChild(vignette);
    }

    svgChange() {
        let svg = this.settings.getValue('svg-filter');
        let fx = document.querySelector('.fx');
        if ( fx === null ) return;

        let style = `
            brightness(var(--brightness))
            contrast(var(--contrast))
            grayscale(var(--grayscale))
            hue-rotate(var(--hue-rotate))
            invert(var(--invert))
            saturate(var(--saturate))
            sepia(var(--sepia))
            blur(var(--blur))
        `;
        let url = '';
        svg = svg.split('-');
        if ( svg.length > 1 ) url = ` url(#${svg[1].trim()})`;
        style += url;
        fx.style.filter = style;
    }

    vignette() {
        const v = this.settings.getValue('vignette');
        var bg = `radial-gradient(ellipse at center,`;
        bg += `rgba(0,0,0,0) 0%,`;
        bg += `rgba(0,0,0,${v/6}) 30%,`;
        bg += `rgba(0,0,0,${v/3}) 60%,`;
        bg += `rgba(0,0,0,${v}) 100%)`;
        var s = '';
        // once Dom class is implemented:
        // this.dom.style('.vignette-layer'. 'backgroundImage', bg);
        var vignette = this.wrapper.querySelector('.vignette-layer');
        if ( vignette !== null ) vignette.style.backgroundImage = bg;
    }

    updateOffsets() {
        this.inner.setAttribute( 'data-x', this.settings.getValue('offsetX') );
        this.inner.setAttribute( 'data-y', this.settings.getValue('offsetY') );
    }

    updateSliderValue( name, value ) {
        var slider = this.wrapper.querySelector( `.nav .slider.${name} input` );
        slider.value = value;
        this.updateField(slider, value);
    }

    // center view by updating translatex and translatey
    centerView() {
        const $ = document.querySelector.bind(document);
        let $s = $('section');
        let $fx = $('.fx');
        let $inner = $('.inner');

        // store $inner dimensions for use later, if not already set
        if( $inner.getAttribute('data-width') === null ) {
            $inner.setAttribute('data-width', $inner.offsetWidth);
            $inner.setAttribute('data-height', $inner.offsetHeight);
        }

        let ispace = parseInt( this.settings.getValue('inner-space') );
        let ospace = parseInt( this.settings.getValue('outer-space') );

        const maxw = window.innerWidth;
        const maxh = window.innerHeight;

        // start by setting the scale
        let scale = Math.min(
            maxw / ( $s.offsetWidth + ispace ),
            maxh / ( $s.offsetHeight + ispace )
        );

        // setup positions for transform
        let x = $s.offsetLeft - ( maxw - $s.offsetWidth ) / 2;
        let y = $s.offsetTop - ( maxh - $s.offsetHeight ) / 2;

        x -= parseInt( $('.field.offsetx input').value );
        y -= parseInt( $('.field.offsety input').value );

        // initiate transform
        const transform = `
            translateX(${-x}px)
            translateY(${-y}px)
            scale(${scale})
        `;
        let w = parseInt( this.settings.getValue('width') );
        let h = parseInt( this.settings.getValue('height') );

        $inner.style.width = 100 + w + ispace + ospace + 'ch';
        $inner.style.height = 100 + h + ispace + ospace + 'ch';

        $fx.style.width = $inner.offsetWidth + 'px';
        $fx.style.height = $inner.offsetHeight + 'px';
        $fx.style.transform = transform;
    }

    registerAppEvents() {

        if ( this.status.has('app-events-registered') ) return;
        else this.status.add('app-events-registered');

        window.addEventListener( 'resize', e => this.centerView().bind(this) );

        this.events.add('.nav .collapsible.effects .field.slider input', 'input', this.centerView.bind(this) );
        this.events.add('.nav .collapsible.dimensions .field.slider input', 'input', this.centerView.bind(this) );
        this.events.add('.nav .field.slider.fontsize input', 'input', this.centerView.bind(this) );
        this.events.add('.nav .field.slider.vignette input', 'input', this.vignette.bind(this));

        let f = document.querySelector('.nav .field.select.svg-filter select');
        f.addEventListener( 'change', this.svgChange.bind(this) );

        // mousewheel zoom handler
        this.events.add('.inner', 'wheel', e => {
            // disallow zoom within parchment content so user can safely scroll text
            let translatez = document.querySelector('.nav .slider.translatez input');
            if ( translatez === null ) return;
            var v = Number( translatez.value );
            if( e.deltaY < 0 ) {
                v += 10;
                if ( v > 500 ) v = 500;
            } else{
                v -= 10;
                if ( v < -500 ) v = -500;
            }
            this.settings.setValue('translatez', v);
            this.updateSliderValue( 'translatez', v );
        }, this );

        interact(this.eidInner)
        .gesturable({
            onmove: function (event) {
                var scale = this.settings.getValue('translatez');
                scale = scale * (5 + event.ds);
                this.updateSliderValue( 'translatez', scale );
                this.dragMoveListener(event);
            }
        })
        .draggable({ onmove: this.dragMoveListener.bind(this) });

    }

    dragMoveListener (event) {
        let target = event.target;
        if ( !target.classList.contains('inner') ) return;
        if ( event.buttons > 1 && event.buttons < 4 ) return;
        let x = (parseFloat(target.getAttribute('data-x')) || 0);
        let oldX = x;
        x += event.dx;
        let y = (parseFloat(target.getAttribute('data-y')) || 0);
        let oldY = y;
        y += event.dy;

        // when middle mouse clicked and no movement, reset offset positions
        if ( event.buttons === 4 ) {
            x = this.settings.getDefault('offsetx');
            y = this.settings.getDefault('offsety');
        }

        this.updateSliderValue( 'offsetx', x );
        this.updateSliderValue( 'offsety', y );

        // update the position attributes
        target.setAttribute('data-x', x);
        target.setAttribute('data-y', y);

        this.centerView();
    }

}


//         $('.code-overlay').show();

//         updateClass('tiltshift');
//         updateClass('font-effect');

// function removeClassByPrefix( element, prefix ) {
//     const el = document.querySelector(element);
//     if ( el === null ) return;
//     var classes = el.classList;
//     for( var c of classes ) {
//         if ( c.startsWith(prefix) ) el.classList.remove(c);
//     }
// }

// function updateClass(type) {
//     var v = $(`.nav .field.select.${type} select`).val().toLowerCase();
//     // remove existing classes first
//     console.log(type, v);
//     removeClassByPrefix( bd.eid + ' .code', type );
//     removeClassByPrefix( bd.eid + ' .code-overlay', type );
//     if ( v !== 'none' || v !== null ) {
//         $('.code').addClass(`${type}-${v}`);
//         $('.code-overlay').addClass(`${type}-${v}`);
//     }
// }


//     $('.nav .field.select.tiltshift select').change(function() {
//         updateClass('tiltshift');
//     });

//     $('.nav .field.select.font-effect select').change(function() {
//         updateClass('font-effect');
//     });
