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
    var f = $( ' .info .field.font select' ).val();
    update_font(f);
    
    default_transform = '.inner { transform: scale(1) translateX(-820px) translateY(-670px)';
    default_transform += ' perspective(300px) rotateX(15deg) rotateY(3deg)';
    default_transform += ' scaleZ(1) rotateZ(10deg) translateZ(0px)};';
    
    // setup default transform if no user provided css
    if ( css === '' ) {
        css = default_transform;
    }
    
    get_transforms(css);
    register_events();

    render_values(true);
    var x = $('.info .slider.translateX input').val();
    var y = $('.info .slider.translateY input').val();
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
    tiltshift();

    // everything loaded, now calculate url params
    gd.update_fields_with_params();
    render_values(true);
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
    $filters = $(`.info .collapsible.${v} .field.slider`);
    $filters.each(function(){
        var $i = $(this).find('input');
        var name = $i.attr('name');
        var value = $i.val();
        var suffix = $i.attr('data-suffix');
        if ( suffix === undefined ) suffix = '';
        if ( name != 'vignette' ) f += `${name}(${value}${suffix}) `;
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
        $(eid_inner).css( 'transform', f );
    }
}

function update_font(f) {
    // remove any existing font link
    $('#gd-font').remove();
    if ( f === undefined || f === null ) f = 'default';
    if ( f.toLowerCase() !== 'default' ) {
        f = f.replace( /\-/g, '+' );
        // capitalize words
        f = f.replace( /\b\w/g, l => l.toUpperCase() );
        f = f.replace( 'Iscript', 'iScript' );
        f = f.replace( 'Ibm', 'IBM' );
        f = f.replace( 'Pt+Mono', 'PT+Mono' );
        f = f.replace( 'Vt323', 'VT323' );
        if ( f === "Fira+Code+iScript") {
            // 'Fira Code iScript'
        } else if ( f === "Fira+Code") {
            //
        } else {
            load_gfont(f);
        }
        // now lets add the font to the section elements
        f = f.replace( /\+/g, ' ' );
        $('.inner .section *').css({ fontFamily : f });
    }
}

function load_gfont(f) {
    const href = '//fonts.googleapis.com/css?family=' + f;
    // create link
    const link = `<link id="gd-font" rel="stylesheet" href="${href}">`;
    $('head').append(link);
}

function tiltshift() {
    var ts = $('.info .field.select.tiltshift select').val().toLowerCase();
    if ( ts === 'none' || ts === null ) {
        $('.code').removeClass(function (index, css) {
            return (css.match (/\btilt-\S+/g) || []).join(' ');
        });
        $('.code-overlay').removeClass(function (index, css) {
            return (css.match (/\btilt-\S+/g) || []).join(' ');
        });
    } else {
        $('.code').removeClass(function (index, css) {
            return (css.match (/\btilt-\S+/g) || []).join(' ');
        });
        $('.code-overlay').removeClass(function (index, css) {
            return (css.match (/\btilt-\S+/g) || []).join(' ');
        });
        $('.code').addClass('tilt-' + ts);
        $('.code-overlay').addClass('tilt-' + ts);
    }
}

function register_events() {

    // set font based on user selection
    $( ' .info .field.font select' ).change(function() {
        var font = $(this).val();
        update_font(font);
    });

    // vignette effect
    $('.info .field.slider.vignette input').on('input change', function(e) {
        var v = $(this).val();
        vignette(v);
    });

    // add click event to sliders
    $('.info .field.slider input').on('input change', function(e) {
        var $p = $(this).closest('.collapsible');
        if ( $p.hasClass('effects') ) {
            render_values(false);
        } else if ( $p.hasClass('perspective') ) {
            render_values(true);
        }
    });

    $('.info .field.select.svg-filter select').change(function() {
        render_values(false);
    });

    $('.info .field.select.tiltshift select').change(function() {
        tiltshift();
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
        $translatez.change();
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
        update_slider_value( 'translateX', x );
        update_slider_value( 'translateY', y );
        // send change event to sliders to update them visually
        // ['translatex', 'translatey'].forEach(function(e) {
        //     document.querySelector( `.info .slider.${e} input` )
        //     .dispatchEvent( new Event('change') );
        // });
        render_values(true);
    } else {
        // translate the element
        target.style.webkitTransform =
        target.style.transform =
            'translate(' + x + 'px, ' + y + 'px)';
    }
    
    // update the position attributes
    target.setAttribute('data-x', x);
    target.setAttribute('data-y', y);
}
