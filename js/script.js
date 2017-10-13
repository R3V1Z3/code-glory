/* global jQuery, $, interact */
jQuery(document).ready(function() {

    // attach the plugin to an element
    $('#wrapper').gitdown( {'title': 'Code Glorify',
                            'content': 'README.md',
                            'markdownit': 'false',
                            'merge_gists': false,
                            'merge_themes': true,
                            'callback': main,
                           } );
    var $gd = $('#wrapper').data('gitdown');
    
    function main() {
        
        var eid_inner = '.inner';
        
        render_slider_panel();
        var css = $gd.get_css();
        
        var default_transform = '.inner { transform: scale(1) translateX(-820px) translateY(-670px)';
        default_transform += ' perspective(280px) rotateX(350deg) rotateY(3deg)';
        default_transform += ' scaleZ(1) rotateZ(342deg) translateZ(0px)};';
        
        // setup default transform if no user provided css
        if ( css === '' ) {
            css = default_transform;
        }
        
        get_transforms(css);
        register_events();
        pinch_zoom(eid_inner);

        var t = transform();
        console.log(t);
        var x = $('.slider.translateX').val();
        var y = $('.slider.translateY').val();
        $('.inner').attr( 'data-x' , x );
        $('.inner').attr( 'data-y' , y );
        
        function pinch_zoom( element ) {
            var scale = Number( $('.slider.scale').val() );
            interact(element)
            .gesturable({
                onmove: function (event) {
                    scale = scale * (1 + event.ds);
                    // update inner with new scale
                    update_slider( 'scale', scale );
                    dragMoveListener(event);
                    transform();
                }
            })
            .draggable({ onmove: dragMoveListener });
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
                    update_slider( name, value );
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
        
        function update_slider( name, value ) {
            $('.slider.' + name).val(value);
            $('.slider.' + name).attr('value', value);
        }
        
        function render_slider_panel() {
            var html = '<div class="sliders draggable panel">';
            html += '<div id="titlebar"><h3>Transform</h3></div>';
            html += create_slider('scale', 1, 0.1 ,6, 0.01);
            html += create_slider('translateX', 0, -2000 ,2000, 1);
            html += create_slider('translateY', 0, -2000 ,2000, 1);
            
            html += create_slider('perspective', 200, 0 ,2000, 1);
            html += create_slider('rotateX', 0, 0 ,360, 1);
            html += create_slider('rotateY', 0, 0 ,360, 1);
            
            html += create_slider('scaleZ', 0, 1 ,5, 0.1);
            html += create_slider('rotateZ', 0, 0 ,360, 1);
            html += create_slider('translateZ', 0, -500 ,500, 1);
            html += '</div>';
            $('#wrapper .container').append(html);
        }
        
        function transform() {
            var t = '';
            $('.sliders .transform').each(function(){
                // add key and value to t array
                var name = $(this).attr('name');
                var value = $(this).val();
                var suffix = 'px';
                if ( name.indexOf('scale') != -1 ) {
                    suffix = '';
                } else if ( name.indexOf('rotate') != -1 ) {
                    suffix = 'deg';
                }
                t += ' ' + name + '(' + value + suffix + ')';
            });
            $(eid_inner).css( 'transform', t );
        }
        
        function register_events() {
            // add click event to sliders
            $('.slider').on('input change', function(e) {
                var name = $(this).attr('name');
                var value = $(this).val();
                $(this).attr('value', value);
                transform();
            });
            
            // mousewheel zoom handler
            $('.inner').on('wheel', function(e){
                var v = Number( $('.slider.translateZ').val() );
                console.log(v);
                if(e.originalEvent.deltaY < 0) {
                    v += 5;
                    if ( v > 500 ) v = 500;
                } else{
                    v -= 5;
                    if ( v < -500 ) v = -500;
                }
                update_slider( 'translateZ', v );
                transform();
            });
        }
        
        // returns html for slider and input paired with css class c
        function create_slider(name, value, min, max, step) {
            var html = '<input class="slider transform ';
            // add transform class to items that are part of transform attribute
            var t = ['scale','rotate','translate','skew','perspective'];
            for ( var i = 0; i < t.length; i++ ) {
                if ( name.indexOf(t[i]) != -1 ) html += ' ' + name;
            }
            html += '"';
            html += 'name="' + name + '" ';
            html += 'type="range" min="' + min;
            html += '" max="' + max + '" value="' + value;
            html += '" step="' + step + '">';
            return html;
        }
        
        // target elements with the "draggable" class
        interact('.draggable').allowFrom('#titlebar')
            .draggable({
                // enable inertial throwing
                inertia: false,
                // keep the element within the area of it's parent
                restrict: {
                  restriction: "parent",
                  endOnly: true,
                  elementRect: { top: 0, left: 0, bottom: 1, right: 1 }
            },
            // enable autoScroll
            autoScroll: true,
            
            // call this function on every dragmove event
            onmove: dragMoveListener,
            // call this function on every dragend event
            onend: function (event) {
              var textEl = event.target.querySelector('p');
            
              textEl && (textEl.textContent =
                'moved a distance of '
                + (Math.sqrt(event.dx * event.dx +
                             event.dy * event.dy)|0) + 'px');
        }
        });
        
        function dragMoveListener (event) {
            var target = event.target;
            var $target = $(target);
            var x = (parseFloat(target.getAttribute('data-x')) || 0) + event.dx;
            var y = (parseFloat(target.getAttribute('data-y')) || 0) + event.dy;
            
            if ( $target.hasClass('inner') ) {
                update_slider( 'translateX', x );
                update_slider( 'translateY', y );
                transform();
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
        
        // this is used later in the resizing and gesture demos
        window.dragMoveListener = dragMoveListener;
    }
    
});