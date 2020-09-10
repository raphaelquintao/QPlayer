define([
    'jquery',
    'utils/Easing',
    'utils/QChapter'
], function ($, Easing, Chapters) {


    var QUtils = {};


    /**
     * Stylishly console output
     * @param name
     * @param version
     * @param msg
     */
    QUtils.consoleHello = function (name, version, msg) {
        var opt = {
            backColor: ['#1f8d87'],
            // backColor: ['#1f8d87', '#F92672'],
            textColor: "#ffffff",
            borderRad: 3,
            fontSize:  20,
            padding:   {
                tb: 5,
                lr: 10
            }
        };


        var fontSmaller = 0.6;
        var fontNormal  = 0.8;

        var bgIndex    = Math.floor(Math.random() * opt.backColor.length);
        var height     = opt.fontSize + opt.padding.tb * 2 + opt.fontSize * fontSmaller / 2;
        var cssBase    = 'background:' + opt.backColor[bgIndex] + '; font-family: Helvetica;';
        var textShadow = 'text-shadow: 0px 0px 2px rgba(0, 0, 0, 0.1);';


        if (navigator.userAgent.indexOf("Chrome") !== -1) {
            cssBase += 'line-height:' + height + 'px; padding-top:' + opt.padding.tb + 'px; padding-bottom:' + opt.padding.tb + 'px;';
            console.log('%c' + name + ' ' + version + ' - ' + msg,

                cssBase + 'color:' + opt.textColor + '; font-size:' + opt.fontSize + 'px; font-weight: bold;' +
                'border-radius:' + opt.borderRad + 'px; padding-left: ' + opt.padding.lr + 'px; padding-right: ' + opt.padding.lr + 'px; ' + textShadow);

        } else if ((navigator.userAgent.indexOf("Firefox") !== -1)) {
            cssBase += 'float:left; height:' + height + 'px; line-height: ' + height + 'px; margin:0;';
            console.log('%c' + name + ' ' + version + ' - ' + msg,

                cssBase + 'color:' + opt.textColor + '; font-size:' + opt.fontSize + 'px; font-weight: bold;' +
                'border-radius:' + opt.borderRad + 'px; padding-left: ' + opt.padding.lr + 'px; padding-right:' + opt.padding.lr + 'px; ' + textShadow);

        } else window.console.log(name + ' ' + version + ' ' + msg);
    };

    /**
     * Format seconds to HH:MM:SS.MS
     * @param sec
     * @param show_hours
     * @param show_ms
     * @return {string}
     */
    QUtils.formatSecs = function (sec, show_hours, show_ms) {
        if (show_hours === undefined) show_hours = false;
        if (show_ms === undefined) show_ms = false;

        var hours = "0" + Math.floor(sec / 3600);
        var min   = "0" + Math.floor(sec / 60 % 60);
        var secs  = "0" + (sec % 60).toFixed(3);

        hours = hours.substr(-2);
        min   = min.substr(-2);
        secs  = secs.substr(-6);
        if (!show_ms) secs = secs.split('.')[0];

        var str = "";
        if (hours > 0 || show_hours) str += hours + ":";
        str += min + ":" + secs;

        return str;
    };


    /**
     *
     * @param element
     * @constructor
     */
    QUtils.FullScreen = function (element) {
        var el = element || document.documentElement;
        if (el.jquery) el = $(el)[0];
        var scope = this;

        this.isFullScreen   = function () {
            return ((document.fullScreenElement
                || document.mozFullScreenElement
                || document.webkitFullscreenElement
                || document.msFullscreenElement) !== undefined);
        };
        this.setFullScreen  = function () {
            if (el.requestFullscreen) el.requestFullscreen();
            else if (el.mozRequestFullScreen) el.mozRequestFullScreen();
            else if (el.webkitRequestFullscreen) el.webkitRequestFullscreen();
            else if (el.msRequestFullscreen) el.msRequestFullscreen();
        };
        this.exitFullScreen = function () {
            if (document.exitFullscreen) document.exitFullscreen();
            else if (document.mozCancelFullScreen) document.mozCancelFullScreen();
            else if (document.webkitExitFullscreen) document.webkitExitFullscreen();
            else if (document.msExitFullscreen) document.msExitFullscreen();
        };
        this.toggle         = function () {
            if (this.isFullScreen()) this.exitFullScreen();
            else this.setFullScreen(el);
        };

        this.onChange = function (isFull) {

        };

        var eventName;
        if (document.fullscreenEnabled) eventName = 'fullscreenchange';
        else if (document.mozFullScreenEnabled) eventName = 'mozfullscreenchange';
        else if (document.webkitFullscreenEnabled) eventName = 'webkitfullscreenchange';
        else if (document.msFullscreenEnabled) eventName = 'MSFullscreenChange';

        document.addEventListener(eventName, function () {
            scope.onChange(scope.isFullScreen());
        });

    };


    /**
     * FPS Monitor.
     * @exports QUtils.FPS
     * @return {QUtils.module:FPS}
     * @class
     */
    QUtils.FPS = function (minimalist_design) {
        if (minimalist_design === undefined) minimalist_design = true;
        var beginTime = Date.now(), prevTime = beginTime, frames = 0;
        var fps       = 0, ms = 0;
        var min       = Infinity, max = 0;

        var dom = document.createElement('div');

        var css = {
            position:        'absolute',
            margin:          '5px',
            backgroundColor: 'rgba(225, 225, 225, 0.952941)',
            padding:         '5px 7px',
            borderRadius:    '5px',
            whiteSpace:      'pre',
            fontFamily:      'Consolas, monospace',
            fontSize:        '16px',
            top:             0,
            right:           0,
            pointerEvents:   'none'
        };

        if (minimalist_design) {
            css.backgroundColor = 'transparent';
            css.color           = '#ffffff';
            css.textShadow      = '0 1px 3px rgba(0, 0, 0, 0.9)';
            css.opacity         = 0.4;
            css.margin          = "3px";
            css.fontSize        = '12px';
            css.fontFamily      = 'Roboto, Helvetica, Arial, sans-serif';
        }

        for (var prop in css) dom.style[prop] = css[prop];

        if (minimalist_design) dom.innerText = fps + ' FPS';
        else dom.innerText = 'FPS: ' + fps + ' (' + min + '-' + max + ")\n MS: " + ms;

        function update() {
            min = Math.min(min, fps);
            max = Math.max(max, fps);
            if (minimalist_design) dom.innerText = fps + ' FPS';
            else dom.innerText = 'FPS: ' + fps + ' (' + min + '-' + max + ")\n MS: " + ms;
        }


        /* PUBLIC */

        this.dom = dom;

        this.begin = function () {
            beginTime = Date.now();
        };

        this.end = function () {
            frames++;
            var time = Date.now();
            ms       = (time - beginTime);
            if (time > prevTime + 1000) {
                fps = Math.round((frames * 1000) / (time - prevTime));
                update();
                prevTime = time;
                frames   = 0;
            }
            return time;
        };

        this.update = function () {
            beginTime = this.end();
        };

        /**
         *
         * @param element
         * @return {QUtils.module:FPS}
         */
        this.appendTo = function (element) {
            element.appendChild(this.dom);
            return this;
        };

        /**
         *
         * @param style
         * @return {QUtils.module:FPS}
         */
        this.setStyle = function (style) {
            if (style != undefined) for (var prop in style) dom.style[prop] = style[prop];
            return this;
        };

        return this;
    };

    /**
     * Canvas and container manipulator.
     * @exports QUtils.Canvas
     * @return {QUtils.module:Canvas}
     * @class
     * @param container
     * @param debugDom
     */
    QUtils.Canvas = function (container, debugDom) {
        var element = document.createElement('canvas');

        this.domDebug   = (debugDom !== undefined) ? debugDom : null;
        this.container  = container;
        this.el         = element;
        this.w          = 0;
        this.h          = 0;
        this.centerX    = 0;
        this.centerY    = 0;
        this.aspect     = 0;
        this.offsetLeft = 0;
        this.offsetTop  = 0;

        this.container.appendChild(this.el);


        /**
         * Refresh.
         * @return {QUtils.module:Canvas}
         */
        this.updateSize = function () {
            this.w          = this.el.parentElement.clientWidth;
            this.h          = this.el.parentElement.clientHeight;
            this.el.width   = this.w;
            this.el.height  = this.h;
            this.aspect     = this.w / this.h;
            this.centerX    = this.w / 2;
            this.centerY    = this.h / 2;
            var offset      = this.el.getBoundingClientRect();
            this.offsetLeft = offset.left;
            this.offsetTop  = offset.top;
            if (this.domDebug !== null) {
                this.domDebug.innerText = "W: " + this.w + "\nH: " + this.h + "\nA: " + this.aspect.toFixed(4);
                this.domDebug.innerText += "\n\nOL: " + this.offsetLeft + "\nOT: " + this.offsetTop;
            }

            return this;
        };


        this.updateSize();

        return this;
    };


    /**
     * Just a tooltip
     * @param {HTMLElement} container
     * @exports QUtils.Tooltip
     * @constructor
     */
    QUtils.Tooltip = function (container) {
        var css   = "";
        var scope = this;

        this.container = (container === undefined) ? document.body : container;

        var style       = document.createElement('style');
        style.innerText = css;

        var tooltip = document.createElement('div');
        tooltip.appendChild(style);
        tooltip.classList.add('qtip');

        this.container.appendChild(tooltip);

        var showing = false;
        var text    = document.createElement('span');
        var timeout;

        document.addEventListener('mousemove', onMouseMove, false);

        function onMouseMove(e) {
            var offL = function (el) {
                return (el.nodeName === 'HTML') ? el.offsetLeft : el.offsetLeft + offL(el.parentElement);
            };
            var offT = function (el) {
                return (el.nodeName === 'HTML') ? el.offsetTop : el.offsetTop + offT(el.parentElement);
            };


            var x = e.clientX - offL(scope.container);
            var y = e.clientY - offT(scope.container);

            x += 15;
            y += 10;

            if (x !== 0 && y !== 0) {
                tooltip.style.left = x + 'px';
                tooltip.style.top  = y + 'px';
            }
        }


        this.show = function (content, autohide) {
            if (autohide === undefined) autohide = true;
            clearTimeout(timeout);
            if (autohide) {
                timeout = setTimeout(function () {
                    scope.hide();
                }, 50);
            }

            if (!showing) {
                text.innerHTML = content;
                tooltip.appendChild(text);
                showing                  = true;
                tooltip.style.visibility = 'visible';
            } else {
                text.innerHTML = content;
            }

        };

        this.hide = function () {
            showing                  = false;
            tooltip.style.visibility = 'hidden';
            tooltip.removeChild(tooltip.childNodes[1]);
        };

    };

    /**
     * Simple Options Menu
     * @exports QUtils.Options
     * @constructor
     */
    QUtils.OptionsMenu = function () {


    };

    /**
     * Experimental Sound Bars
     * @exports QUtils.SoundBars
     * @constructor
     */
    QUtils.SoundBars = function (video) {
        var scope                      = this;
        this.canvas                    = document.createElement('canvas');
        this.canvas.style              = 'width: 200px; height: 200px;position: absolute; top: 50%;left: 0;z-index: 200;background: transparent;';
        this.canvas.style["transform"] = 'translateY(-50%)';

        var canvasCtx = this.canvas.getContext('2d', {
            antialias: true
        });

        var audioCtx = new AudioContext();
        var analyser = audioCtx.createAnalyser();

        var source = audioCtx.createMediaElementSource(video);
        source.connect(analyser);
        analyser.connect(audioCtx.destination);

        analyser.fftSize = 256;
        //analyser.fftSize = 256;
        // var bufferLength = analyser.fftSize;
        var bufferLength = analyser.frequencyBinCount;
        var dataArray    = new Uint8Array(bufferLength);

        analyser.getByteFrequencyData(dataArray);

        // console.log(bufferLength);
        // console.log(scope.canvas.width, scope.canvas.height);

        var bars   = 128;
        var radius = 5;
        var size   = (4 * Math.PI * radius) / bars;
        var max    = 0;

        function draw() {
            // requestAnimationFrame(draw);
            var WIDTH = scope.canvas.width = scope.canvas.clientWidth;
            var HEIGHT = scope.canvas.height = scope.canvas.clientHeight;

            // var WIDTH = scope.canvas.width = 200;
            // var HEIGHT = scope.canvas.height = 200;

            analyser.getByteFrequencyData(dataArray);

            canvasCtx.clearRect(0, 0, WIDTH, HEIGHT);

            canvasCtx.lineWidth     = 0.01;
            canvasCtx.strokeStyle   = 'rgba(0, 0, 0,0.1)';
            canvasCtx.shadowColor   = 'rgba(0, 0, 0,0.7)';
            canvasCtx.shadowBlur    = 2;
            canvasCtx.shadowOffsetX = 0;
            canvasCtx.shadowOffsetY = 0;

            var centerX = WIDTH / 2;
            var centerY = HEIGHT / 2;

            max = (Math.min(WIDTH, HEIGHT) - radius * 2) / 2 - 10;

            canvasCtx.fillStyle = "rgba(0, 0, 0, 0)";
            var x               = 0;
            var y               = 0;
            var step            = 4 * Math.PI / bars;
            var ok              = 0;
            var avg             = 0;
            var v               = 0;
            // for (var i = 0; i < 4 * Math.PI; i += step) {
            for (var i = 0; i < 4 * Math.PI; i += step) {
                x                   = centerX + radius * Math.cos(i);
                y                   = centerY - radius * Math.sin(i);
                v                   = dataArray[ok] / 256;
                avg += (v > 0) ? v : 0;
                var alpha           = (v > 0) ? 1 - v * 0.3 : 0;
                canvasCtx.fillStyle = 'rgba(' + Math.ceil(255 * v) + ',' + (ok) + ',50, ' + alpha + ')';
                drawRotatedRect(x, y, max * v, size, i);
                ok++;

            }
            // console.log(ok);

            canvasCtx.beginPath();
            canvasCtx.arc(centerX, centerY, radius, 0, 2 * Math.PI, false);
            avg                   = (avg > 0) ? avg / 128 + 0.2 : 0;
            canvasCtx.lineWidth   = 2;
            canvasCtx.strokeStyle = 'rgba(255,255,255,' + avg + ')';
            canvasCtx.stroke();

        }

        draw();

        function drawRotatedRect(x, y, width, height, degrees) {
            canvasCtx.save();
            canvasCtx.beginPath();
            canvasCtx.translate(x, y);
            canvasCtx.rotate(-1 * degrees);
            var size2 = (4 * Math.PI * (max + radius)) / bars;
            var c     = (size2 - size) / 2;
            trap(canvasCtx, 0, -height / 2, width, height, c);
            canvasCtx.fill();
            canvasCtx.restore();

        }

        function trap(ctx, x, y, width, height, cres) {
            var c = cres;
            ctx.moveTo(x, y);
            ctx.lineTo(x + width, y - c);
            ctx.quadraticCurveTo(x + width + c / 2, (2 * y + height) / 2, x + width, y + c + height);
            ctx.lineTo(x + width, y + c + height);
            ctx.lineTo(x, y + height);
            ctx.lineTo(x, y);
            ctx.closePath();
        }

        this.render = draw;


    };


    return QUtils;
});

