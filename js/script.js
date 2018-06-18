var default_transform;
var eid_inner = '.inner';
var svg_filter;

const gd = new GitDown('#wrapper', {
    title: 'Code Glory',
    content: 'README.md',
    markdownit: 'false',
    merge_gists: false,
    callback: done
});

var eid = gd.eid;
var timeout;

function done() {

    // remove any existing svg ids
    $('#svg').remove();
    $('.info .toc-heading').remove();
    $('.info .toc').remove();

    svg_filter = gd.get_param('svg-filter');
    extract_svg('filters.svg');

    // wrap .inner with an fx div
    if ( $('.fx').length === 0 ) {
        $(eid_inner).wrap('<div class="fx">');
        $('.fx').append('<div class="vignette"></div>');
    }
    
    var v = $('.info .field.slider.vignette input').val();
    vignette(v);

    var h = $('.info .field.select.highlight select').change();
    
    var css = gd.get_setting('style');
    
    default_transform = '.inner { transform: scale(1)';
    default_transform += ' perspective(1500px) rotateX(15deg) rotateY(3deg)';
    default_transform += ' scaleZ(1) rotateZ(10deg) translateZ(0px)};';

    // setup default transform if no user provided css
    if ( css === '' ) {
        css = default_transform;
    }
    
    get_transforms(css);
    register_events();

    var x = $('.info .slider.offsetX input').val();
    var y = $('.info .slider.offsetY input').val();
    $(eid_inner).attr( 'data-x' , x );
    $(eid_inner).attr( 'data-y' , y );

    // include message for firefox users re: fx layer
    if( navigator.userAgent.toLowerCase().indexOf('firefox') !== -1 ){
        var fx_fields = document.querySelector( '.info .field.collapsible.effects .contents' );
        if ( fx_fields !== null ) {
            var message = 'Sorry, effects are currently disabled in Firefox due to technical hurdles. ';
            var link = '<a href="https://alternativeto.net/software/ungoogled-chromium/">Ungoogled Chromium</a>';
            message += `Please consider using a safe and modern alternative such as ${link}.`;
            fx_fields.innerHTML = message;
        }
    }

    $('.code-overlay').show();

    // everything loaded, now calculate url params
    gd.update_from_params();
    render_values(true);
    toggle_class('tiltshift');
    toggle_class('font-effect');
}

function vignette(v) {
    var bg = `radial-gradient(ellipse at center,`;
    bg += `rgba(0,0,0,0) 0%,`;
    bg += `rgba(0,0,0,${v/6}) 30%,`;
    bg += `rgba(0,0,0,${v/3}) 60%,`;
    bg += `rgba(0,0,0,${v}) 100%)`;
    var s = '';
    var vignette = document.querySelector( eid + ' .vignette' );
    if ( vignette !== null ) {
        vignette.style.backgroundImage = bg;
    }
}

function extract_svg(filename) {
    $.get( filename, function(data) {
        // add svg filters to body
        var div = document.createElement("div");
        div.id = 'svg';
        div.innerHTML = new XMLSerializer().serializeToString(data.documentElement);
        document.body.insertBefore(div, document.body.childNodes[0]);

        var $select = $('.info .field.select.svg-filter select');
        if ( $select.length > 0 ) {
            // $select exists, so lets add the imported filters
            $('#svg defs filter').each(function() {
                var id = $(this).attr('id');
                var name = $(this).attr('inkscape:label');
                $select.append(`<option>${name}-${id}</option>`);
            });
        }

        // we'll update svg-filter url parameter now that svg is loaded
        var $select = $('.info .select.svg-filter select');
        $select.val(svg_filter);
        $select.change();
    });
}
    
function get_transforms(css) {
    if ( css != '' ) {
        var v = parse_for_transforms(default_transform);//parse_for_transforms(css);
        // use default_transform if no transform provided in user css
        if ( v === '' ) {
            v = parse_for_transforms(default_transform);
        }
        
        v = v.split(' ');
        
        for ( var i = 0; i < v.length; i++ ) {
            // name will be all text up til paren (
            var name = v[i].split('(')[0];
            // value will be data after opening paren (
            var value = v[i].split('(')[1].trim();
            // remove closing paren )
            value = Number(value.replace(/[^0-9\.\-]+/g,""));
            update_slider_value( name, value );
        }
    }
}

function parse_for_transforms(css) {
    // split at .inner
    if ( css.indexOf('.inner {') != -1 ) {
        var i = css.split( '.inner {' )[1];
        i = i.split('}')[0];
        // now split at transform:
        if ( i.indexOf('transform:') != -1 ) {
            var j = i.split( 'transform:' )[1];
            return j.trim();
        }
    }
    return '';
}

function update_slider_value( name, value ) {
    var slider = document.querySelector( `.info .slider.${name} input` );
    slider.value = value;
    slider.setAttribute( 'value', value );
}

// t = true when rendering transforms
function render_values(t) {
    var f = '';
    var v = 'effects';
    if (t) v = 'perspective';
    $fields = $(`.info .collapsible.${v} .field.slider`);
    $fields.each(function(){
        var $i = $(this).find('input');
        var name = $i.attr('name');
        var value = $i.val();
        var suffix = $i.attr('data-suffix');
        if ( suffix === undefined ) suffix = '';
        // add values of tranform sliders to f
        if ( name != 'vignette' ) {
            f += `${name}(${value}${suffix}) `;
        }
    });
    if (!t) {
        var svg = $('.info .field.select.svg-filter select').val();
        var x = '';
        if ( svg === 'none' || svg === null ) {
        } else {
            var splt = svg.split('-');
            svg = splt[splt.length - 1];
            f += `url("#${svg}")`;
        }
        
        // todo: filter breaks on firefox, we'll hide it for now
        if( navigator.userAgent.toLowerCase().indexOf('firefox') === -1 ){
            $('.fx').css( 'filter', f );
        }
    } else if (t) {
        // center viewport
        const e = document.querySelector( gd.eid );
        const section = document.querySelector( gd.eid + ' .section');
        let w = $('.info .field.slider.width input').val();
        let p = $('.info .field.slider.padding input').val();

        section.setAttribute("style", `width: ${w}px; padding: ${p}em;`);
        w = section.offsetWidth;
        h = section.offsetHeight;
        let x = section.offsetLeft;
        let y = section.offsetTop;
        if ( e !== null ) {
            //w = e.offsetWidth;
            const maxwidth = window.innerWidth;
            const maxheight = window.innerHeight;

            // calculate translateX and translateY based on offsets
            const offsetX = parseInt($('.info .field.slider.offsetX input').val());
            const offsetY = parseInt($('.info .field.slider.offsetY input').val());

            // it is not centered in the middle of .section
            let translateX = -(x - (maxwidth / 2) + w / 2);
            let translateY = -(y - (maxheight / 2 ) + h / 2);

            translateX += offsetX;
            translateY += offsetY;
            
            f += `translateX(${translateX}px) `;
            f += `translateY(${translateY}px) `;

            $(eid_inner).css( 'transform', f );
            // because of this transform, boundingClienRect() changes
        }
    }
}

function remove_class_by_prefix( element, prefix ) {
    const el = document.querySelector(element);
    var classes = el.classList;
    for( var c of classes ) {
        if ( c.startsWith(prefix) ) el.classList.remove(c);
    }
}

function toggle_class(type) {
    var v = $(`.info .field.select.${type} select`).val().toLowerCase();
    // remove existing classes first
    remove_class_by_prefix( gd.eid + ' .code', type );
    remove_class_by_prefix( gd.eid + ' .code-overlay', type );
    if ( v !== 'none' || v !== null ) {
        $('.code').addClass(`${type}-${v}`);
        $('.code-overlay').addClass(`${type}-${v}`);
    }
}

function register_events() {

    window.addEventListener('resize', function(event){
        // this fires multiple times during resize
        // we'll render values each time as it looks better
        render_values(true);
    });

    // vignette effect
    $('.info .field.slider.vignette input').on('input change', function(e) {
        var v = $(this).val();
        vignette(v);
    });

    // add change event to sliders
    $('.info .field.slider input').on('input change', function(e) {
        var $p = $(this).closest('.collapsible');
        if ( $p.hasClass('effects') ) {
            render_values(false);
        } else if ( $p.hasClass('perspective') || $p.hasClass('dimensions') ) {
            render_values(true);
        }
    });

    $('.info .field.select.svg-filter select').change(function() {
        render_values(false);
    });

    $('.info .field.select.tiltshift select').change(function() {
        toggle_class('tiltshift');
    });

    $('.info .field.select.font-effect select').change(function() {
        toggle_class('font-effect');
    });

    // mousewheel zoom handler
    $('.inner').on('wheel', function(e){
        var $translatez = $('.info .slider.translateZ input');
        var v = Number( $translatez.val() );
        if(e.originalEvent.deltaY < 0) {
            v += 5;
            if ( v > 500 ) v = 500;
        } else{
            v -= 5;
            if ( v < -500 ) v = -500;
        }
        update_slider_value( 'translateZ', v );
        //$translatez.change();
        render_values(true);
    });

    interact(eid_inner)
    .gesturable({
        onmove: function (event) {
            var $translatez = $('.info .slider.translatez input');
            var scale = Number( $translatez.val() );
            scale = scale * (1 + event.ds);
            // update inner with new scale
            update_slider_value( 'translateZ', scale );
            $translatez.change();
            dragMoveListener(event);
        }
    })
    .draggable({ onmove: dragMoveListener });
}

function dragMoveListener (event) {
    var target = event.target;
    var x = (parseFloat(target.getAttribute('data-x')) || 0) + event.dx;
    var y = (parseFloat(target.getAttribute('data-y')) || 0) + event.dy;
    
    if ( target.classList.contains('inner') ) {
        update_slider_value( 'offsetX', x );
        update_slider_value( 'offsetY', y );
        var $offsetX = $('.info .slider.offsetX input');
        var $offsetY = $('.info .slider.offsetY input');
        $offsetX.change();
        $offsetY.change();
        render_values(true);
    } else {
        // update_slider_value( 'offsetX', x );
        // update_slider_value( 'offsetY', y );

        // translate the element
        // target.style.webkitTransform =
        // target.style.transform =
        //     'translate(' + x + 'px, ' + y + 'px)';
    }
    
    // update the position attributes
    target.setAttribute('data-x', x);
    target.setAttribute('data-y', y);
}
