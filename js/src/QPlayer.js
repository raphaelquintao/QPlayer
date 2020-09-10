define([
    'jquery',
    'THREE',
    'QUtils',
    'core/CameraUtils',
    'core/TextRender',
    'core/CircularMenu',
    'utils/QChapter',
    'utils/QSub'
], function ($, THREE, QUtils, CamUtils, TextRender, CircularMenu, QChapter, QSub) {

    /**
     * Module QPlayer
     * @param id
     * @param {QPlayer.OPTIONS} options
     * @exports QPlayer
     * @class
     * @return {*}
     */
    var QPlayer = function (id, options) {
        var dom;
        if (typeof id === 'string') {
            id = (id.indexOf('#') === 0) ? id.slice(1) : id;
            if (QPlayer.players[id]) {
                if (options) console.warn("Player " + id + " is already initialised. Options will not be applied.");
                return QPlayer.players[id];
            } else dom = document.getElementById(id);
        } else dom = id;

        if (!dom || !dom.nodeName || dom.nodeName !== 'VIDEO') {
            throw new TypeError('The element or ID supplied is not valid. (QPlayer.js)');
        }
        // return QPlayer.players[id] = new Player(dom, options);
        return QPlayer.players[id] = new PlayerComponent(dom, options);
    };

    QPlayer.players        = [];
    QPlayer.VERSION        = 0.27;
    QPlayer.AspectModeFill = 1;
    QPlayer.AspectModeFit  = 2;

    /**
     * QPlayer setup options
     * @typedef {Object} QPlayer.OPTIONS
     * @property {number} width - Sets the display height of the video player in pixels.
     * @property {number} height - Sets the display height of the video player in pixels.
     * @property {boolean} autoplay - If true, begins playback when the player is ready.
     * @property {boolean} loop - Causes the video to start over as soon as it ends.
     * @property {boolean} muted - Will silence any audio by default.
     * @property {number} volume - Sets the start volume of the video, value from range [0, 1].
     * @property {number} startTime - Sets the start time of the video, in seconds.
     * @property {Object} aspectMode - 3D plane object Aspect Mode.
     * @property {number} animMargin - Margin for mouse animation.
     */
    QPlayer.OPTIONS = {
        width:      1280,
        height:     720,
        autoplay:   false,
        loop:       false,
        muted:      true,
        //
        // Custom OPTIONS
        //
        volume:     0.3,
        startTime:  0,
        aspectMode: QPlayer.AspectModeFill,
        animMargin: 0.09
    };


    /**
     * QPlayer instance.
     * @param {HTMLVideoElement} dom
     * @param {QPlayer.OPTIONS} params
     * @constructor
     */
    function PlayerComponent(dom, params) {

        //<editor-fold desc="Description">
        QUtils.consoleHello('QPlayer.js', QPlayer.VERSION, 'quintao.ninja');


        var scope           = this;
        var video           = dom;
        var container       = document.createElement('div');
        var active          = true;
        var active_timeout  = 0;
        var chapter_timeout = 0;

        var ASPECTRATIO = {fill: 1, fit: 2};

        var options = {
            width:          params.width || 1280,
            height:         params.height || 720,
            autoplay:       params.autoplay || false,
            loop:           params.loop || false,
            volume:         params.volume || 0,
            startTime:      params.startTime || 0,
            subtitlesColor: params.subtitlesColor || 0xffffff,
            subtitles:      params.subtitles || false,
            chapters:       params.chapters || false,
            aspectMode:     params.aspectMode || 1,
            animMargin:     0.09,
            fps:            params.fps || 60

        };

        var chapters = new QChapter(video);

        // var subtitles = new QUtils.VideoSubtitles(video).appendMenuTo(container);

        var sub = new QSub(video).appendMenuTo(container);

        // sub.addEventListener('start', function(event) {
        //     console.log(event.message);
        // });
        // sub.start();

        // console.log(sub);

        // container.appendChild(subtitles.domSelect);

        var tooltip = new QUtils.Tooltip(container);

        // $("#debug3").on('mouseover', function () {
        //     tooltip.show('ovo', false);
        // }).on('mouseout', function () {
        //     tooltip.hide('ovo');
        // });

        // var sound_bars = new QUtils.SoundBars(video);
        // container.appendChild(sound_bars.canvas);


        var t = {
            canvas:     null,
            renderer:   null,
            camera:     null,
            scene:      null,
            fps:        null,
            preloader:  null,
            menu:       null,
            textRender: null
        };

        function initContainer() {
            container.style     = 'width: 100%; height: 100%;';
            container.className = 'QPlayer';
            video.parentNode.appendChild(container);
        }

        function init() {
            initContainer();
            t.canvas        = new QUtils.Canvas(container, $("#debug3")[0]);
            t.mouseNormal   = new THREE.Vector2();
            t.mouseRelative = new THREE.Vector2();
            t.renderer      = new THREE.WebGLRenderer({
                canvas:    t.canvas.el,
                antialias: true,
                alpha:     true
            });
            t.renderer.setClearColor(0x000000, 0);
            t.renderer.setPixelRatio(window.devicePixelRatio);
            t.renderer.setSize(t.canvas.w, t.canvas.h, false);
            t.renderer.shadowMap.enabled = true;
            t.renderer.shadowMap.type    = THREE.PCFSoftShadowMap;

            t.camera            = new THREE.PerspectiveCamera(45, t.canvas.aspect, 1, 10000);
            t.camera.position.z = 200;

            t.scene = new THREE.Scene();

            t.fps = new QUtils.FPS();
            t.fps.appendTo(container);


            t.menu         = new CircularMenu(t.canvas);
            t.menu.enabled = true;
            t.menu.create();


            t.textRender = new TextRender(t.canvas, 'fonts/Roboto_Regular.json');

            t.textRender.mouse = t.menu.mouse;

            t.textRender.fontColor = options.subtitlesColor;


            /* EVENTS */
            window.addEventListener('resize', function (e) {
                t.canvas.updateSize();

                t.camera.aspect = t.canvas.aspect;
                if (t.objVideo) ScaleCameraToVideoObj(t.camera, t.objVideo);
                t.camera.updateProjectionMatrix();
                t.renderer.setSize(t.canvas.w, t.canvas.h, false);

                if (t.menu) t.menu.updateForWindowResize();
                if (t.loading) t.loading.updateForWindowResize();
                if (t.textRender) t.textRender.updateForWindowResize();

            }, false);

            container.addEventListener('mousemove', function (e) {
                e.preventDefault();

                var x = e.clientX - t.canvas.offsetLeft;
                var y = e.clientY - t.canvas.offsetTop;

                t.mouseRelative.x = (x / t.canvas.w) * 2 - 1;
                t.mouseRelative.y = -(y / t.canvas.h) * 2 + 1;

                var margin = options.animMargin;
                t.mouseRelative.x *= margin;
                t.mouseRelative.y *= margin;

                if (x >= 0 && x <= t.canvas.w) {
                    t.mouseNormal.x = (x - t.canvas.centerX);
                }
                if (y >= 0 && y <= t.canvas.h) {
                    t.mouseNormal.y = (y - t.canvas.centerY);
                }

                // var debug = $("#debug1")[0];
                // debug.innerText = "Mouse X: " + x + "\n";
                // debug.innerText += "Mouse Y: " + y + "\n\n";
                // debug.innerText += "Mouse X: " + (t.mouseNormal.x) + "\n";
                // debug.innerText += "Mouse Y: " + (t.mouseNormal.y) + "\n\n";
                // debug.innerText += "Mouse X: " + (t.mouseRelative.x).toFixed(3) + "\n";
                // debug.innerText += "Mouse Y: " + (t.mouseRelative.y).toFixed(3) + "\n";

                active = true;
                clearTimeout(active_timeout);
                active_timeout = setTimeout(function () {
                    active         = false;
                    t.menu.mouse.x = 0;
                    t.menu.mouse.y = 0;
                }, 5000);

            }, false);

            initVideo();

            animate();
        }


        // var fps = 120;

        function animate() {
            // setTimeout(animate, 1000 / fps);
            render();
            t.fps.update();
            requestAnimationFrame(animate);
        }

        function render() {
            if (t.videoTexture
                && (video.readyState >= video.HAVE_CURRENT_DATA)
                && !video.paused
            ) t.videoTexture.needsUpdate = true;

            t.objVideo.position.x += (-t.mouseRelative.x * options.width - t.objVideo.position.x) * 0.05;
            t.objVideo.position.y += (t.mouseRelative.y * options.height - t.objVideo.position.y) * 0.05;
            t.renderer.render(t.scene, t.camera);
            if (t.textRender) t.textRender.render(t.renderer);
            if (t.menu) {
                t.menu.hide = !active;
                t.menu.render(t.renderer);
                updateBuffer();
            }
            if (t.preloader) {
                t.preloader.render(t.renderer);
            }

            // sound_bars.render();

            $("#debug1")[0].innerText = (active) ? "Active" : "Inactive";

        }


        function updateBuffer() {
            if (video.buffered && (video.buffered.length > 0)) {
                for (var i = 0; i < video.buffered.length; i++)
                    t.menu.progressBar.setBufferTime(video.buffered.start(i), video.buffered.end(i), i);
            }
        }

        function ScaleCameraToVideoObj(cam, mesh_obj) {
            var w      = options.width;
            var h      = options.height;
            var a      = w / h;
            var margin = options.animMargin * 2;

            if (options.aspectMode == ASPECTRATIO.fill) {
                cam.position.z = CamUtils.distance(cam, (h * (a - margin)));
            } else {
                if (cam.aspect >= a) cam.position.z = CamUtils.distance(cam, (h * (cam.aspect - margin)));
                else cam.position.z = CamUtils.distance(cam, (w * (1 - margin)));
            }

            if (options.aspectMode == ASPECTRATIO.fill)
                mesh_obj.scale.x = mesh_obj.scale.y = (cam.aspect > a) ? cam.aspect : a;
            else
                mesh_obj.scale.x = mesh_obj.scale.y = cam.aspect;
        }

        function initVideo() {
            // video.crossOrigin = 'anonymous';

            // t.videoTexture = new THREE.VideoTexture(video);
            t.videoTexture = new THREE.Texture(video);

            t.videoTexture.generateMipmaps = false;
            t.videoTexture.minFilter       = THREE.LinearFilter;
            t.videoTexture.magFilter       = THREE.LinearFilter;
            t.videoTexture.format          = THREE.RGBAFormat;


            var v_material = new THREE.MeshBasicMaterial({
                color:       0xffffff,
                map:         t.videoTexture,
                transparent: true
            });

            // var v_material = new THREE.MeshBasicMaterial({
            // 	color: 0x4f4f4f,
            // 	transparent: true,
            // 	opacity: 0
            // });

            var v_geometry = new THREE.PlaneBufferGeometry(options.width, options.height, 16, 16);

            t.objVideo = new THREE.Mesh(v_geometry, v_material);

            t.scene.add(t.objVideo);

            ScaleCameraToVideoObj(t.camera, t.objVideo);

        }

        function setOptions() {
            video.volume   = options.volume;
            video.loop     = options.loop;
            video.autoplay = options.autoplay;
            video.controls = false;
            video.load();

            console.log(video);

        }

        setOptions();
        init();


        /* PUBLIC */


        //</editor-fold>

        /* EVENTS */

        if (video.textTracks.length > 0) {
            // console.dir(video);
            // console.log(video.textTracks);

            // video.addTextTrack("captions", "English", "en");


            // console.log(video.textTracks[1].cues.getCueById("1"));

            // console.log(Object.keys(video.textTracks));

            video.textTracks.onchange      = function (e) {
                console.log('Change');
                console.log(e);
            };
            video.textTracks.oncuechange   = function (e) {
                console.log('Cue Change');
                console.log(e);
            };
            video.textTracks.onaddtrack    = function (e) {
                console.log('Add Track');
                console.log(e);
            };
            video.textTracks.onremovetrack = function (e) {
                console.log('Remove TRack');
                console.log(e);
            };


        }


        t.menu.chapter.onMouseOver = function (centerX, centerY) {
            chapters.showMenu(container, true, centerX, centerY);
        };
        t.menu.chapter.onMouseOut  = function () {
            chapters.showMenu(container, false);
        };

        chapters.onChange = function (text) {
            t.menu.chapter.setCurrent(text);
        };
        sub.oncuechange   = function (cue) {
            t.textRender.updateText(cue.text.replace(/<\/?(i|u|b|font)([^>]*)>/g, ''));
        };

        video.onloadstart      = function (e) {
            e.preventDefault();
            console.log('loadstart');
            t.menu.loading.show();
        };
        video.onloadend        = function () {
            console.log('loadend');
        };
        video.onprogress       = function (e) {
            // console.log('onprogress', e);
        };
        video.ondurationchange = function () {
            console.log('durationchange');
            t.menu.videoDuration = Math.floor(video.duration);

            video.currentTime = options.startTime;

        };
        video.onloadedmetadata = function () {
            console.log('loadedmetadata');

            // console.dir(video);
            var w = video.videoWidth;
            var h = video.videoHeight;
            // console.log(w, h);


            t.menu.videoCurrentTime = Math.floor(video.currentTime);

            t.menu.volumeBar.setVolume(video.volume);
            t.menu.volumeBar.onVolumeChange = function (percent) {
                video.volume = percent;
            };

            t.menu.buttonsUi.btnLoop.isLoop  = video.loop;
            t.menu.buttonsUi.btnLoop.onClick = function (isLoop) {
                video.loop = isLoop;
            };


            t.menu.progressBar.onTimeChange = function (secs) {
                video.currentTime = secs;
            };

            t.menu.progressBar.onMouseOver = function (secs) {
                var text = '';
                text += chapters.getLabelBySeconds(secs);
                if (text !== '') text += "<br>";
                text += QUtils.formatSecs(secs);

                tooltip.show(text);
            };

            t.menu.volumeBar.onMouseOver = function (percent) {
                tooltip.show(Math.round(percent * 100) + "%");
            }

        };

        video.onloadeddata = function () {
            console.log('loadeddata');
            t.menu.enabled = true;

            t.menu.buttonsMedia.btnPlayPause.isPaused = video.paused;
            t.menu.buttonsMedia.btnPlayPause.onChange = function (isPaused) {
                if (isPaused) video.pause();
                else video.play();
            };

            var fullScr                        = new QUtils.FullScreen(container);
            fullScr.onChange                   = function (isFull) {
                t.menu.buttonsUi.btnResize.isFull = isFull;
            };
            t.menu.buttonsUi.btnResize.isFull  = fullScr.isFullScreen();
            t.menu.buttonsUi.btnResize.onClick = function (isFull) {
                if (isFull) fullScr.setFullScreen();
                else fullScr.exitFullScreen();

            };
            if (t.videoTexture && (video.readyState >= video.HAVE_CURRENT_DATA)) t.videoTexture.needsUpdate = true;
        };

        video.ontimeupdate     = function () {
            // console.log('timeupdate');
            t.menu.videoCurrentTime = Math.floor(video.currentTime);
        };
        video.onwaiting        = function (e) {
            // console.log('waiting');
            t.menu.loading.show();
        };
        video.oncanplay        = function (e) {
            // console.log('canplay');
            if (t.videoTexture && (video.readyState >= video.HAVE_CURRENT_DATA)) t.videoTexture.needsUpdate = true;
        };
        video.oncanplaythrough = function (e) {
            // console.log('canplaythrough');
            t.menu.loading.hide();
        };
        video.onseeking        = function () {
            t.menu.loading.show();
        };
        video.onseeked         = function () {

        };
        video.onended          = function () {
            console.log('ended');
            t.menu.buttonsMedia.btnPlayPause.isPaused = video.paused;
        };
    }


    return QPlayer;
});




