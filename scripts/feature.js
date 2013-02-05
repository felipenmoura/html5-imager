$(document).ready(function(){
    
    var _canvas= document.getElementById('canvas'),
        _canvasArea= document.getElementById('canvas'),
        _loadingEl= $('#loadingEl'),
        __canvas= $(_canvas),
        _ctx= _canvas.getContext('2d'),
        _canvasImgData= null,
        _originalImgData= false,
        _pickedColor= $('#pickedColor'),
        _defaultCompositeHTML= $('#selectedPx').html(),
        _currentPixelEl= $('#currentPixel'),
        _effectWorker= null,
        _scheduled= false,
        _workerSrc= 'scripts/worker.js',
        _conf= {
            h: null,
            s: null,
            l: null,
            precision: 8,
            coords: false,
            applyFilter: false,
            filterLevel: 10,
            curPixel: null,
            loading: false
        };
    
    var _constructor= function(){
        
        /**
         * Apply the slider widget to Hue.
         * 
         * This also sets its method to be executed when sliding.
         * In this case, it changes the hue of the openes image.
         */
        $('#hue').slider({
            value: 50,
            max: 100,
            min: 0,
            step: 1,
            animate: false,
            slide: function(evt, handle){
                _conf.h= handle.value/100;
                _applyEffect();
                _getPixel(_conf.coords);
            }
        });

        /**
         * Apply the slider widget to saturation.
         * 
         * This also sets its method to be executed when sliding.
         * In this case, it changes the saturation of the openes image.
         */
        $('#saturation').slider({
            value: 50,
            max: 100,
            min: 0,
            step: 1,
            animate: false,
            slide: function(evt, handle){
                _conf.s= handle.value/100;
                _applyEffect();
                _getPixel(_conf.coords);
            }
        });

        /**
         * Apply the slider widget to Light.
         * 
         * This also sets its method to be executed when sliding.
         * In this case, it changes the light of the openes image.
         * 
         * TODO: it does now work as expected! :/
         */
        $('#light').slider({
            value: 50,
            max: 100,
            min: 0,
            step: 1,
            animate: false,
            slide: function(evt, handle){
                _conf.l= handle.value/100;
                _applyEffect();
                _getPixel(_conf.coords);
            }
        });

        /**
         * Apply the slider widget to precision.
         * 
         * Precision changes the number of pixels to be visualized in the left
         * panel once a pixel is selected.
         */
        $('#thumb-precision').slider({
            value: 8,
            max: 24,
            min: 6,
            step: 2,
            range: 'min',
            disabled: true,
            orientation: 'vertical',
            slide: function(evt, handle){
                _conf.precision= handle.value;
                _getPixel(_conf.coords);
            }
        });

        /**
         * Apply the slider widget to filter level.
         * 
         * The filter level is the sensitivity of the filter to remove all the
         * pixels with a given color.
         */
        $('#filter-level').slider({
            value: 1,
            max: 254,
            min: 1,
            step: 1,
            disabled: true,
            range: 'min',
            slide: function(evt, handle){
                _conf.filterLevel= handle.value;
                _applyEffect();
            }
        });

        /**
         * Checks if it should or not apply the filter(removing pixels)
         */
        $('#applyFilter').click(function(){
            if(this.checked){
                _conf.applyFilter= true;
                $('#filter-level').slider('enable');
            }else{
                _conf.applyFilter= false;
                $('#filter-level').slider('disable');
            }
            _applyEffect();
        });

        /**
         * The file input handler.
         */
        $('#newImage-ipt').change(function(evt){
            var f = evt.target.files[0];
            var fr = new FileReader();

            fr.onload = function(ev2) {
                $('#images-list').append('<img src="'+ev2.target.result+'" class="thumb"/>');
            };

            fr.readAsDataURL(f);
        });

        /**
         * The download button's action.
         */
        $('#download-btn').click(function(){
            window.open(_canvas.toDataURL());
        });

        /**
         * Adds the actions for the thumbnails on the list of images.
         */
        $('#images-list').click(function(evt){
            if(evt.target.tagName == 'IMG'){
                
                var img= new Image();
                
                _setLoading(true);
                __canvas.addClass('loading');
                img.onload= function(){
                    _canvas.width= this.width;
                    _canvas.height= this.height;
                    _ctx.drawImage(img, 0, 0, this.width, this.height);
                    __canvas.removeClass('loading');
                    __canvas.addClass('withBG');
                    _canvasImgData= _ctx.getImageData(0, 0, this.width, this.height);
                    _originalImgData= _ctx.getImageData(0, 0, this.width, this.height);
                    setTimeout(_setLoading, 500);
                };
                img.src= evt.target.src;
            }
        });
        
        // when clicked, the canvas should get the current pixel.
        __canvas.click(function(evt){if(!_conf.loading) _getPixel(evt); });
        _resizeCanvasArea();
        $(window).on('resize', _resizeCanvasArea);
    }
    
    /**
     * Sets the interface as busy.
     */
    var _setLoading= function(bool){
        if(bool){
            _conf.loading= true;
            _loadingEl.show();
        }else{
            _conf.loading= false;
            _loadingEl.hide();
        }
    };
    
    /**
     * Resizes the canvas container so the canvas can be scrolled as needed.
     */
    var _resizeCanvasArea= function(){
        var el= $('#edited-image');
        
        el.css({
            width: document.body.clientWidth - 255,
            height: el.height= document.body.clientHeight - 94
        });
    }
    
    /**
     * Removes all the applied effects.
     */
    var _resetEffects= function(){
        
        _conf= {
            h: null,
            s: null,
            l: null,
            precision: 8,
            coords: false,
            applyFilter: false,
            filterLevel: 10,
            curPixel: null
        };
        
        $('#selectedPx').html(_defaultCompositeHTML);
        
        $('#applyFilter')[0].checked= false;//.removeAttribute('checked');
        
        $('#thumb-precision').slider({value: 8}).slider('disable');
        $('#hue').slider({value: 50});
        $('#saturation').slider({value: 50});
        $('#filter-level').slider({value: 1}).slider('disable');
//        $('#').slider({value: });
        
        _ctx.putImageData(_originalImgData, 0, 0);
        _canvasImgData= _ctx.getImageData(0, 0, _canvas.width, _canvas.height);
    };
    
    // adding the reset method to the respective button.
    $('#clear-btn').click(_resetEffects);
    
    /**
     * Applies the defined effects.
     * 
     * It uses the current hsl and filter settings to apply them to the image.
     */
    var _applyEffect= function(){
        
        var r, g, b, i=0, hsl, rgb, alpha,
            data= _canvasImgData.data,
            l= data.length/4,
            frame= _canvasImgData,
            settings= null;
        
        if(!_canvasImgData)
            return false;

        /* this turns out not to be a good feature
        if(_conf.loading){
            clearTimeout(_scheduled);
            _scheduled= setTimeout(_applyEffect, 400);
            return false;
        }
        */
        
        _setLoading(true);
        
        settings= {
            frame: frame,
            l: l,
            r: r,
            g: g,
            b: b,
            conf: _conf
        };
        
        if(window.Worker){
            
            if(!_effectWorker)
                _effectWorker= new Worker(_workerSrc);
            
            _effectWorker.onmessage= function(msg){
                var data= msg.data;
                _ctx.putImageData(data, 0, 0);
                setTimeout(_setLoading, 200);
            };
            _effectWorker.postMessage(settings);
            
        }else{
            _ctx.putImageData(applyEffect(settings), 0, 0);
            setTimeout(_setLoading, 200);
        }
    };
    
    /**
     * Retrieves a pixel.
     * 
     * It receives a click event, or an array with the coordinates of the click.
     * This method sets the current focused pixel as clicked.
     */
    var _getPixel= function(evt){
        
        if(!evt)
            return false;
        
        var x= evt.originalEvent? (evt.originalEvent.offsetX||evt.originalEvent.layerX): evt[0],
            y= evt.originalEvent? (evt.originalEvent.offsetY||evt.originalEvent.layerY): evt[1],
            data= null,
            precision= _conf.precision,
            dataAttr= '',
            pickedColorString= "",
            container= $('#selectedPx'),
            l, i= 0, str= "";
        
        _conf.coords= [x, y];
        
        if(x<precision/2){
            x= 2;
        }
        if(x+(precision/2) >_canvas.width){
            x= _canvas.width - (precision/2);
        }
        
        if(y<precision/2){
            y= precision/2;
        }
        if(y+(precision/2) >_canvas.height){
            y= _canvas.height - 2;
        }
        
        x-= (precision/2);
        y-= (precision/2);
        
        data= _ctx.getImageData(x, y, precision, precision);
        data= data.data;
        _conf.curPixel= _ctx.getImageData(x, y, 1, 1).data;
        pickedColorString= 'rgba('+_conf.curPixel[0]+', '+_conf.curPixel[1]+', '+_conf.curPixel[2]+', '+_conf.curPixel[3]+')';
        _pickedColor.val(pickedColorString);
        
        l= data.length/4;
        
        for(; i<l; i++){
            dataAttr= (data[i*4] +','+ data[i*4+1] +','+ data[i*4+2] +','+ data[i*4+3] );
            str+= "<div style='width: "+(container[0].offsetWidth/(precision) - 0.3)+"px; height: "+(container[0].offsetHeight/(precision) - 0.3)+"px; background-color: rgba("+dataAttr+")' data-color='rgba("+dataAttr+")' data-x='"+x+"' data-y='"+y+"'></div>";
        }
        
        container.html(str);
        container.find('div').on('click', function(){
            var data= $(this).attr('data-color');
            _pickedColor.val(data);
            _conf.curPixel= _ctx.getImageData($(this).attr('data-x'), $(this).attr('data-y'), 1, 1).data;
            //console.log(_ctx.getImageData($(this).attr('data-x'), $(this).attr('data-y'), 1, 1))
            _currentPixelEl.css('backgroundColor', data);
            _applyEffect();
        });
        $('#thumb-precision').slider('enable');
        
        _currentPixelEl.css('backgroundColor', pickedColorString);
        _applyEffect();
        
    };
    
    if(window.Worker){
        console.log("Web workers enabled");
        _constructor();
    }else{
        console.log("Web workers not supported...loading script");
        $.getScript(_workerSrc, _constructor);
    }
});