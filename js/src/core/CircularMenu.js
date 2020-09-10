define([
    'THREE',
    'utils/Easing',
    'core/Curves',
    'core/Geometries',
    'core/QGroup',
    'QVideo',
    'QUtils',
    'core/Fonts'
], function (THREE, Easing, QCurves, QGeo, QGroup, QVideo, QUtils, Fonts) {

    /**
     * Circular Menu
     * @param canvas
     * @constructor
     */
    function CircularMenu(canvas) {

        /* Others */
        function viewSize(cam, dist, log) {
            if (log === undefined) log = false;

            var vFOV   = cam.fov * Math.PI / 180;        // convert vertical fov to radians
            var height = 2 * Math.tan(vFOV / 2) * dist; // visible height

            var aspect = cam.aspect;
            var width  = height * aspect;                  // visible width

            if (log) console.log("W: ", width, "\nH: ", height, "\nA: ", aspect, "\nD: ", dist);

            return {
                w: width,
                h: height,
                a: aspect,
                d: dist
            }
        }

        function loadFonts(callback, what) {
            if (what === undefined) what = 'default';
            var loader;
            if (what === 'default') {
                if (fonts.default === null) {
                    loader = new THREE.FontLoader();
                    loader.load('fonts/Roboto_Regular.json', function (resp) {
                        fonts.default = resp;
                        callback();
                    });
                } else callback();
            }
        }


        /* Basic Objects*/
        this.debugDom = null;
        this.canvas   = canvas;
        this.camera   = null;

        var scope         = this;
        var dom           = canvas.el;
        var scene;
        var textureLoader = new THREE.TextureLoader();
        var raycaster     = new THREE.Raycaster();
        var mouse         = new THREE.Vector2(-1, -1);
        var intersecs     = [];
        var selected      = null;
        var toRaycast     = [];
        var view;
        var bgObj;

        var data = {
            eventsEnabled: false,
            animTimeout:   null,
            hover:         false,
            cursor:        'default',
            volume:        0,
            hidding:       false,
            inAnimation:   false
        };

        /* SET PUBLIC OBJECTS */

        this.mouse = mouse;

        /* HIDE OPTION */
        this.hide = false;


        /* NEW OPTIONS */
        this.opt = {
            disc:        {
                color:           0x404040,
                diameter:        470,
                depth:           20,
                outerSize:       30,
                innerSize:       4,
                animWidthOpen:   20,
                animWidthClosed: 1,
                animDepth:       4,
                animColor:       0xffffff,
                borderSize:      1,
                borderWidth:     4
            },
            volumeBar:   {
                color:        0xff5500,
                width:        22,
                depth:        14,
                margin:       10,
                amount:       50,
                offsetDegree: 40
            },
            progressBar: {
                colorProg:   0xff9900,
                colorBuffer: 0x0071b7,
                colorHover:  0xe45105,
                colorBG:     0x404040,
                width:       25, //24
                margin:      2
            }
        };

        scope.opt.text = {
            time:    {
                color:  0xffffff,
                size:   22,
                height: 11
            },
            chapter: {
                color:  0xffffff,
                size:   scope.opt.disc.outerSize / 2 * 0.9,
                height: 1
            }
        };

        scope.opt.buttons = {
            play:   {
                color:  0xffffff,
                size:   70,
                height: scope.opt.disc.depth
            },
            ui:     {
                color:  0xffffff,
                size:   scope.opt.disc.outerSize * 0.7,
                height: 2
            },
            volume: {
                color:  0xffffff,
                size:   20,
                height: scope.opt.volumeBar.depth
            }
        };


        /* CONTROL */

        var volumePercent    = 0;
        var videoDuration    = 0;
        var videoCurrentTime = 0;

        /* PROPERTIES */

        this.position        = 'center';
        this.enabled         = true;
        this.enableAnimation = true;
        this.enableShadows   = true;


        Object.defineProperty(this, 'videoDuration', {
            get: function () {
                return videoDuration;
            },
            set: function (value) {
                videoDuration = value;
                scope.progressBar.updateDuration();
                timeText.updateTextDuration()
            }
        });

        Object.defineProperty(this, 'videoCurrentTime', {
            get: function () {
                return videoCurrentTime;
            },
            set: function (value) {
                if (value == videoCurrentTime) return;
                videoCurrentTime = value;
                if (videoCurrentTime <= videoDuration) {
                    scope.progressBar.updateCurrent();
                    timeText.updateTextCurrent();
                }
            }
        });

        Object.defineProperty(this, 'volumePercent', {
            get: function () {
                return volumePercent;
            },
            set: function (value) {
                scope.volumeBar.setVolume(value);
            }
        });


        /* OBJECTS */

        var fonts         = {default: Fonts.helvetiker, icons: Fonts.icons};
        var textures      = {
            metalSmooth: null,
        };
        this.menuGroup    = new QGroup('menuGroup');
        this.bodyGroup    = new QGroup('bodyGroup');
        var chapterText   = null;
        this.chapter      = {};
        var timeText      = null;
        this.buttonsMedia = new QGroup('btnMediaGroup');
        this.buttonsUi    = new QGroup('btnUiGroup');
        this.progressBar  = null;
        this.volumeBar    = null;
        this.loading      = new QGroup('loadingGroup');


        /* CREATION */

        function createBody() {
            textures.metalSmooth           = textureLoader.load("textures/smooth-metal-1024.jpg");
            textures.metalSmooth.magFilter = THREE.LinearFilter;
            textures.metalSmooth.minFilter = THREE.LinearFilter;
            textures.metalSmooth.wrapS     = THREE.RepeatWrapping;
            textures.metalSmooth.wrapT     = THREE.RepeatWrapping;
            textures.metalSmooth.repeat.set(10, 1);


            var borderMat = new THREE.MeshStandardMaterial({ //MeshDepthMaterial
                color:             scope.opt.disc.animColor,
                emissiveIntensity: 0.2,
                roughness:         0.57,
                metalness:         0.90,
                flatShading:       true,
                side:              THREE.FrontSide,
                transparent:       true,
                map:               textures.metalSmooth
                // opacity: 1
            });


            var matDisc = new THREE.MeshStandardMaterial({  //MeshStandardMaterial
                color:             scope.opt.disc.color,
                emissive:          0x000000,
                emissiveIntensity: 0.04,
                roughness:         0.37,
                metalness:         0.25,
                flatShading:       true,
                side:              THREE.FrontSide,
                map:               textures.metalSmooth,
                // transparent: false,
                // wireframe:true
            });

            var border_size  = scope.opt.disc.animWidthClosed + scope.opt.disc.animWidthOpen;
            var border_width = scope.opt.disc.animDepth;

            var outerRadius = scope.opt.disc.diameter / 2 - border_size;
            var innerRadius = outerRadius - scope.opt.disc.outerSize;

            var outerWidth = scope.opt.disc.depth;
            var innerWidth = outerWidth;

            var progSize = scope.opt.progressBar.width;
            var size     = scope.opt.disc.innerSize;

            var precision = 1024;


            var outerDiscGeo = QGeo.disc(outerRadius, innerRadius, outerWidth, innerWidth, precision);
            var innerDiskGeo = QGeo.disc(innerRadius - progSize, innerRadius - progSize - size, innerWidth, innerWidth, precision);
            outerDiscGeo.merge(innerDiskGeo);

            var discObj           = new THREE.Mesh(outerDiscGeo, matDisc);
            discObj.name          = 'disc';
            discObj.castShadow    = true;
            discObj.receiveShadow = true;

            scope.bodyGroup.add(discObj);


            var borderGeo = QGeo.disc(outerRadius + scope.opt.disc.animWidthClosed, outerRadius, border_width, border_width, precision);

            var borderObj           = new THREE.Mesh(borderGeo, borderMat);
            borderObj.name          = 'discBorder';
            borderObj.castShadow    = true;
            borderObj.receiveShadow = false;

            scope.bodyGroup.add(borderObj);
        }

        function createTimeText() {
            var holdMat = new THREE.MeshPhongMaterial({
                color:       0xff9900,
                transparent: true,
                opacity:     0.5,
                visible:     false
                // flatShading: true
            });

            var textMat = new THREE.MeshStandardMaterial({
                color:             scope.opt.text.time.color,
                emissive:          0xffffff,
                emissiveIntensity: 0.2,
                roughness:         0.5,
                metalness:         0.9,
                flatShading:       true,
                side:              THREE.FrontSide,
                transparent:       true,
                opacity:           0.95,
                visible:           true
            });


            var textSett = {
                font:           fonts.default,
                size:           scope.opt.text.time.size,
                height:         scope.opt.text.time.height,
                curveSegments:  4,
                bevelEnabled:   true,
                bevelThickness: 0.1,
                bevelSize:      0.1,
                bevelSegments:  3
            };


            var mRadius = scope.opt.disc.diameter / 2;
            mRadius -= scope.opt.disc.animWidthClosed;
            mRadius -= scope.opt.disc.animWidthOpen;
            mRadius -= scope.opt.disc.outerSize;
            mRadius -= scope.opt.disc.innerSize;
            mRadius -= scope.opt.progressBar.width;
            mRadius -= scope.opt.volumeBar.margin * 2;
            mRadius -= textSett.size / 2;


            /* UTILS */
            function createHolder(material, name) {

                var holderGeo           = new THREE.BoxGeometry(1, 1, 1);
                var holderObj           = new THREE.Mesh(holderGeo, material);
                holderObj.name          = name;
                holderObj.castShadow    = false;
                holderObj.receiveShadow = false;
                holderObj.renderOrder   = -1;

                /* Translate and Rotate */

                // holderObj.position.y = 60;

                holderObj.translateZ(scope.opt.disc.depth / 2);

                /* Add to Raycasting and Render */

                // toRaycast.push(holderObj);
                scope.bodyGroup.add(holderObj);

                return holderObj;
            }

            function createContainer(material, visible, name) {
                var textObj           = new THREE.Mesh(new THREE.Geometry(), material);
                textObj.name          = name;
                textObj.visible       = visible;
                textObj.castShadow    = true;
                textObj.receiveShadow = false;
                textObj.renderOrder   = -1;

                return textObj;
            }

            function createLetterGeo(text) {
                var textGeo = new THREE.TextGeometry(text, textSett);
                // textGeo.center();

                textGeo.computeBoundingBox();

                var boxGeo = textGeo.boundingBox;
                var offset = boxGeo.getCenter().negate();

                textGeo.translate(offset.x, -(textSett.size / 2) * 0.8, offset.z);

                // console.log(boxGeo.getSize());

                return textGeo;
            }


            // Create TEXT

            var path = new QCurves.SemiCircle(mRadius, 1, 0, false);

            var maxLength = path.getLength() / textSett.size * 1.3;
            var margin    = 0.3;

            function createTextGeo(text, position) {
                var textGeo = new THREE.Geometry();

                var letters = text.split("");
                var length  = letters.length;

                /* Translate and Rotate */

                var step = Math.PI / maxLength;

                var point = 0;

                var offset = maxLength / 2;
                if (position === -1) offset -= length + margin;
                if (position === 1) offset += 1 + margin;

                var letterGeo;

                for (var c = 0; c < length; c++) {
                    letterGeo = createLetterGeo(letters[c]);

                    letterGeo.rotateZ(Math.PI / 2);

                    letterGeo.rotateZ(-step * (c + offset));

                    point = path.getPoint((1 / maxLength) * (c + offset));

                    letterGeo.translate(point.x, point.y, -(textSett.height + textSett.bevelThickness * 2));

                    textGeo.merge(letterGeo);
                }

                return textGeo;
            }

            /* TEXT CONTAINERS */
            timeText = function () {
                var holder        = createHolder(holdMat, 'timeText');
                var textDuration  = createContainer(textMat, true, 'textDuration');
                var textSeparator = createContainer(textMat, true, 'textSeparator');
                var textCurrent   = createContainer(textMat, true, 'textCurrent');
                holder.add(textCurrent, textSeparator, textDuration);

                var geometry = new THREE.TorusGeometry(10, 3, 16, 100);
                // var material = new THREE.MeshBasicMaterial( { color: 0xffff00 } );
                // var torus = new THREE.Mesh( geometry, material );
                // holder.add(torus);

                var hasSeparator = false;
                var hasHours     = false;

                function updateSeparator() {
                    var text = "|";

                    textSeparator.geometry.dispose();
                    textSeparator.geometry = createTextGeo(text, 0);

                    hasSeparator = true;
                }

                holder.updateTextCurrent = function () {
                    if (fonts.default === null) return;
                    textSett.font = fonts.default;

                    var text = QUtils.formatSecs(videoCurrentTime, hasHours);

                    textCurrent.geometry.dispose();
                    textCurrent.geometry = createTextGeo(text, -1);

                };

                holder.updateTextDuration = function () {
                    if (fonts.default === null) return;
                    textSett.font = fonts.default;

                    hasHours = Math.floor(videoDuration / 3600) > 0;
                    var text = QUtils.formatSecs(videoDuration);

                    textDuration.geometry.dispose();
                    textDuration.geometry = createTextGeo(text, 1);

                    if (!hasSeparator) updateSeparator();

                };


                return holder;
            }();


            loadFonts(function callback() {
                timeText.updateTextDuration();
                timeText.updateTextCurrent();

            }, 'default');


        }

        function createChapterText() {
            var holdMat = new THREE.MeshPhongMaterial({
                color:       0xff00b2,
                side:        THREE.FrontSide,
                transparent: true,
                opacity:     0,
                visible:     true
            });

            var textMat = new THREE.MeshStandardMaterial({
                color:             scope.opt.text.chapter.color,
                emissive:          0xffffff,
                emissiveIntensity: 0.2,
                roughness:         0.5,
                metalness:         0.9,
                flatShading:       true,
                side:              THREE.FrontSide,
                transparent:       true,
                opacity:           0.8
            });

            var textSett = {
                font:           fonts.default,
                size:           scope.opt.text.chapter.size,
                height:         scope.opt.text.chapter.height,
                curveSegments:  4,
                bevelEnabled:   true,
                bevelThickness: 0.1,
                bevelSize:      0.1,
                bevelSegments:  3
            };

            var mRadius = scope.opt.disc.diameter / 2;
            mRadius -= scope.opt.disc.animWidthClosed;
            mRadius -= scope.opt.disc.animWidthOpen;
            mRadius -= scope.opt.disc.outerSize / 2;


            /* UTILS */
            function createOverlay(material, name) {
                var tStart  = -Math.PI;
                var tLength = Math.PI;

                var overlayGeo           = new THREE.RingGeometry(mRadius - textSett.size, mRadius + textSett.size / 2, 128, 3, tStart, tLength);
                var overlayObj           = new THREE.Mesh(overlayGeo, material);
                overlayObj.name          = name;
                overlayObj.castShadow    = true;
                overlayObj.receiveShadow = false;
                overlayObj.renderOrder   = -90;

                /* Translate and Rotate */


                overlayObj.translateZ(textSett.height / 2 + textSett.bevelThickness);

                /* Add to Raycasting and Render */

                toRaycast.push(overlayObj);
                scope.bodyGroup.add(overlayObj);

                return overlayObj;
            }

            function createHolder(material, name) {
                var holderGeo           = new THREE.BoxGeometry(1, 1, 1);
                var holderObj           = new THREE.Mesh(holderGeo, material);
                holderObj.name          = name;
                holderObj.castShadow    = false;
                holderObj.receiveShadow = false;
                holderObj.renderOrder   = -1;

                /* Translate and Rotate */

                // holderObj.position.y = 60;

                holderObj.translateZ(scope.opt.disc.depth / 2);

                /* Add to Raycasting and Render */

                // toRaycast.push(holderObj);
                scope.bodyGroup.add(holderObj);

                return holderObj;
            }

            function createContainer(material, visible, name) {
                var textObj           = new THREE.Mesh(new THREE.Geometry(), material);
                textObj.name          = name;
                textObj.visible       = visible;
                textObj.castShadow    = false;
                textObj.receiveShadow = false;
                textObj.renderOrder   = -1;

                return textObj;
            }

            function createLetterGeo(text) {
                var textGeo = new THREE.TextGeometry(text, textSett);
                // textGeo.center();

                textGeo.computeBoundingBox();

                var boxGeo = textGeo.boundingBox;
                var offset = boxGeo.getCenter().negate();

                textGeo.translate(offset.x, -(textSett.size / 2) * 0.8, 0);

                // console.log(boxGeo.getSize());

                return textGeo;
            }

            var path = new QCurves.SemiCircle(mRadius, 1, 0);

            var maxLenght = path.getLength() / textSett.size * 1.3;

            function createTextGeo(text) {
                var textGeo = new THREE.Geometry();

                var letters = text.split("");
                var length  = letters.length;

                /* Translate and Rotate */

                var step = Math.PI / (maxLenght);

                var point = 0;


                var offset = maxLenght / 2;
                offset -= length / 2 - 0.5;

                var letterGeo;
                for (var c = 0; c < length; c++) {
                    letterGeo = createLetterGeo(letters[c]);

                    letterGeo.rotateZ(-Math.PI / 2);


                    letterGeo.rotateZ(step * (c + offset));

                    point = path.getPoint((1 / (maxLenght)) * (c + offset));


                    letterGeo.translate(point.x, point.y, 0);


                    textGeo.merge(letterGeo);
                }

                return textGeo;
            }

            /* TEXT CONTAINERS */
            chapterText = function () {
                var holder      = createHolder(holdMat, 'chapterText');
                var textChapter = createContainer(textMat, true, 'textChapter');
                var textOverlay = createOverlay(holdMat, 'chapterOverlay');
                holder.add(textChapter, textOverlay);

                function updateOverlay(textLenght) {
                    var step = Math.PI / (maxLenght);

                    var tStart  = -Math.PI;
                    var tLength = textLenght * step;
                    tStart += (maxLenght - textLenght) / 2 * step;
                    var off     = textSett.size * 0.2;

                    var overlayGeo = new THREE.RingGeometry(mRadius - textSett.size / 2 - off, mRadius + textSett.size / 2 + off, 128, 3, tStart, tLength);

                    textOverlay.geometry.dispose();
                    textOverlay.geometry = overlayGeo;

                }

                holder.updateText = function (text) {
                    if (text === undefined) text = '';

                    if (fonts.default === null) return;
                    textSett.font = fonts.default;

                    // var text = 'Raphael Quintao Silveira';
                    // var text = 'Era um vez um pinto pedrez quer que eu te conte outra vez?';
                    // var text = 'Era uma vez um pinto pedrez quer que eu te conte outra vez? Raphael Quintao Silveira';
                    // var text = 'Another Brick In The Wall (Part 3)';
                    // var text = '';

                    textChapter.geometry.dispose();
                    textChapter.geometry = createTextGeo(text);

                    updateOverlay(text.length);

                };

                scope.chapter.setCurrent = function (text) {
                    holder.updateText(text);
                };

                scope.chapter.onMouseOver = function (centerX, centerY) {
                    // console.log("MouseOver", holder.name);
                };

                textOverlay.internalMouseOver = function () {
                    if (scope.debugDom !== null)
                        scope.debugDom.innerText += "\n\n" + "MouseOver: " + holder.name;

                    textOverlay.geometry.computeBoundingBox();
                    var bBox = new THREE.Box3().setFromObject(textOverlay);

                    // var centerX = scope.canvas.centerX + (bBox.getCenter().x * view.w * 0.03);
                    var centerX = scope.canvas.centerX + (bBox.getCenter().x);
                    var centerY = mRadius / scope.opt.disc.diameter * scope.canvas.h;
                    scope.chapter.onMouseOver(centerX, centerY * 2);

                    // console.log(centerX);
                };

                scope.chapter.onMouseOut = function () {
                    console.log("MouseOut", holder.name);
                };

                textOverlay.internalMouseOut = function () {
                    scope.chapter.onMouseOut();
                };


                scope.chapter.onClick = function (centerX, centerY) {
                    //console.log("Click", holder.name, centerX, centerY);
                };

                textOverlay.internalClick = function () {
                    var centerY = mRadius / scope.opt.disc.diameter * scope.canvas.h;
                    scope.chapter.onClick(scope.canvas.centerX, centerY * 2);
                };

                return holder;
            }();


            loadFonts(function callback() {
                chapterText.updateText();

            }, 'default');


        }

        function createLoadingAnimation() {
            var border_size  = scope.opt.disc.borderSize + scope.opt.disc.animWidthOpen;
            var border_width = scope.opt.disc.borderWidth;

            var outerRadius = scope.opt.disc.diameter / 2 - border_size;
            var innerRadius = outerRadius - scope.opt.disc.outerSize;

            var outerWidth = scope.opt.disc.animDepth;
            var innerWidth = scope.opt.disc.depth;

            var animMargin = scope.opt.disc.animWidthOpen;

            var outerPath = new QVideo.Curve.Circle(outerRadius - (border_size - animMargin) / 2);

            var iconMat = new THREE.MeshStandardMaterial({
                color:             0xffffff,
                emissive:          0xffffff,
                emissiveIntensity: 0.2,
                roughness:         0.25,
                metalness:         0.9,
                flatShading:       true,
                side:              THREE.FrontSide,
                transparent:       true,
                map:               textures.metalSmooth
                // opacity: 1
            });

            var textSett = {
                font:           fonts.icons,
                size:           animMargin * 2,
                height:         outerWidth / 2 + 0.6,
                // curveSegments: 4,
                bevelEnabled:   true,
                bevelThickness: 0.3,
                bevelSize:      0.3,
                bevelSegments:  3,
                // material: 0,
                // extrudeMaterial: 1
            };

            var starPoints = 20;

            var scale = 0;

            var textNinja = String.fromCharCode("0xf1d5");


            function createHolder(name, visible, opacity) {
                var holderMat = new THREE.MeshBasicMaterial({
                    color:       0xff00b2,
                    side:        THREE.DoubleSide,
                    transparent: true,
                    opacity:     opacity,
                    visible:     visible
                });

                var inner = outerRadius + (border_size - animMargin) / 2;
                var outer = inner + animMargin;

                var holderGeo = new THREE.RingGeometry(inner, outer, starPoints, 1);

                var holderObj           = new THREE.Mesh(holderGeo, holderMat);
                holderObj.name          = name;
                holderObj.castShadow    = false;
                holderObj.receiveShadow = false;
                holderObj.renderOrder   = -1;

                // holderObj.position.z = outerWidth / 2;

                scope.loading.add(holderObj);

                return holderObj;
            }

            function createIcon(material, text, visible, name) {
                var textGeo = new THREE.TextGeometry(text, textSett);
                textGeo.computeBoundingBox();

                var boxGeo = textGeo.boundingBox;
                var offset = boxGeo.getCenter().negate();

                var size  = boxGeo.getSize();
                var max   = Math.max(size.x, size.y);
                var scale = boxGeo.getSize().subScalar(max - textSett.size).divide(boxGeo.getSize());


                textGeo.translate(offset.x, offset.y * 1.1, offset.z);
                textGeo.scale(scale.x, scale.y, 1);

                var textObj = new THREE.Mesh(textGeo, material);
                if (name !== undefined) textObj.name = name;
                textObj.visible       = visible;
                textObj.castShadow    = false;
                textObj.receiveShadow = false;
                textObj.renderOrder   = -1;

                return textObj;
            }


            /* OBJECTS */
            var holder       = createHolder('loadingHolder', false, 0.5);
            var ninja        = createIcon(iconMat, textNinja, true);
            ninja.castShadow = true;

            ninja.geometry.scale(4, 0.8, 1);

            ninja.geometry.rotateZ(Math.PI / 2);

            var point;
            var step = 2 * Math.PI / starPoints;

            for (var c = 0; c < starPoints; c++) {
                var obj = ninja.clone();

                point = outerPath.getPoint(1 / starPoints * c);
                obj.rotateZ(step * c);
                obj.position.set(point.x, point.y, 0);

                holder.add(obj);
            }

            var min = 0.944;

            scale          = min;
            holder.scale.x = holder.scale.y = scale;


            /* FUNCTIONS / EVENTS */
            scope.loading.show = function () {
                scale = 1;
            };

            scope.loading.hide = function () {
                scale = min;
            };

            scope.loading.toogle = function () {
                if (scale === 1) scale = min;
                else scale = 1;
            };

            scope.loading.render = function () {
                holder.scale.x = holder.scale.y += (scale - holder.scale.x) * 0.1;
                if (scale === 1) {
                    holder.rotation.z -= 0.02;
                    holder.visible = true;
                }
                else if (holder.scale.x > (min + 0.005)) holder.rotation.z += 0.01;
                else if (holder.visible) holder.visible = false;
            };


            scope.bodyGroup.add(scope.loading);
        }

        function CreateButtonsMedia() {
            var opts = scope.opt.buttons;

            var holdMat = new THREE.MeshPhongMaterial({
                color:       0xff9900,
                transparent: true,
                opacity:     0,
                visible:     false
            });

            var iconMat = new THREE.MeshStandardMaterial({
                color:       opts.play.color,
                // emissive: 0xffdee5,
                // emissiveIntensity: 0.1,
                roughness:   0.5,
                metalness:   0.9,
                flatShading: false,
                side:        THREE.FrontSide,
                transparent: true,
                opacity:     0.89
            });

            var textSett = {
                font:           fonts.icons,
                size:           opts.play.size,
                height:         opts.play.height,
                // curveSegments: 4,
                bevelEnabled:   true,
                bevelThickness: 1,
                bevelSize:      1,
                bevelSegments:  8,
                // material: 0,
                // extrudeMaterial: 1
            };

            /* UTILS */
            function createHolder(material, position, name) {
                var offsetZ = 0.1;

                var holderGeo           = new THREE.PlaneGeometry(textSett.size, textSett.size);
                var holderObj           = new THREE.Mesh(holderGeo, material);
                holderObj.name          = name;
                holderObj.castShadow    = true;
                holderObj.receiveShadow = false;
                holderObj.renderOrder   = -1;

                /* Translate and Rotate */

                // NOT YET

                /* Add to Raycasting and Render */

                toRaycast.push(holderObj);
                scope.bodyGroup.add(holderObj);

                return holderObj;
            }

            function createIcon(material, text, visible, name, scaleSize) {
                scaleSize = (scaleSize !== undefined) ? scaleSize : textSett.size;

                var textGeo = new THREE.TextGeometry(text, textSett);
                textGeo.computeBoundingBox();

                var boxGeo = textGeo.boundingBox;
                var offset = boxGeo.getCenter().negate();

                var size  = boxGeo.getSize();
                var max   = Math.max(size.x, size.y);
                var scale = boxGeo.getSize().subScalar(max - scaleSize).divide(boxGeo.getSize());


                textGeo.translate(offset.x, offset.y, offset.z);
                textGeo.scale(scale.x, scale.y, 1);

                var textObj           = new THREE.Mesh(textGeo, material);
                textObj.name          = name;
                textObj.visible       = visible;
                textObj.castShadow    = true;
                textObj.receiveShadow = false;
                textObj.renderOrder   = 0;

                return textObj;
            }

            /* BUTTONS */
            var buttonsMedia = scope.buttonsMedia;

            buttonsMedia.btnPlayPause = function () {
                var textPlay  = String.fromCharCode("0xe804");
                var textPause = String.fromCharCode("0xe805");

                var btnPlayPause = createHolder(holdMat, 1, 'btnPlayPause');
                var iconPlay     = createIcon(iconMat, textPlay, true, 'iconPlay');
                var iconPause    = createIcon(iconMat, textPause, false, 'iconPause');
                btnPlayPause.add(iconPlay, iconPause);


                /* Function / Events */
                Object.defineProperty(btnPlayPause, 'isPaused', {
                    get: function () {
                        return this.children[0].visible || false; // Play visible
                    },
                    set: function (paused) {
                        var play      = this.children[0];
                        var pause     = this.children[1];
                        pause.visible = !(play.visible = paused);
                        this.onChange(this.isPaused);
                    }
                });

                btnPlayPause.internalClick = function () {
                    this.isPaused = !this.isPaused;
                };

                btnPlayPause.onChange = function (paused) {
                    if (scope.debugDom !== null)
                        console.log(this.name, "Changed Paused:", paused);
                };

                btnPlayPause.internalMouseOver = function () {
                    if (scope.debugDom !== null) {
                        scope.debugDom.innerText += "\n\n" + "MouseOver: " + this.name + "\nPaused: " + this.isPaused;
                    }
                    this.children[0].material.opacity = 1;
                    this.children[1].material.opacity = 1;
                };

                function clear() {
                    this.material.opacity = 0.8;
                }

                iconPlay.onAfterRender  = clear;
                iconPause.onAfterRender = clear;


                return btnPlayPause;

            }();


        }

        function CreateButtonsUI() {
            var opts = scope.opt.buttons;

            var holdMat = new THREE.MeshStandardMaterial({
                color:             0xff9900,
                emissive:          0xffffff,
                emissiveIntensity: 0.1,
                roughness:         0.2,
                metalness:         0.3,
                flatShading:       true,
                side:              THREE.FrontSide,
                transparent:       true,
                opacity:           0
                // wireframe:true
            });

            var iconMat = new THREE.MeshStandardMaterial({
                color:       opts.ui.color,
                // emissive: 0xffffff,
                // emissiveIntensity: 0.2,
                roughness:   0.5,
                metalness:   0.9,
                flatShading: true,
                side:        THREE.FrontSide,
                transparent: true,
                opacity:     1
            });

            var textSett = {
                font:           fonts.icons,
                size:           opts.ui.size,
                height:         opts.ui.height,
                // curveSegments: 4,
                bevelEnabled:   true,
                bevelThickness: 0.1,
                bevelSize:      0.1,
                bevelSegments:  3,
                // material: 0,
                // extrudeMaterial: 1
            };

            var mRadius = scope.opt.disc.diameter / 2 - (scope.opt.disc.borderSize + scope.opt.disc.animWidthOpen) - scope.opt.disc.outerSize / 2;

            var parts = 20;

            // console.log(textSett.size);

            /* UTILS */
            function createHolder(material, position, name) {
                var offsetZ = 0.1;

                var holderGeo           = new THREE.PlaneGeometry(textSett.size, textSett.size);
                var holderObj           = new THREE.Mesh(holderGeo, material);
                holderObj.name          = name;
                holderObj.castShadow    = false;
                holderObj.receiveShadow = false;
                holderObj.renderOrder   = -1;

                /* Translate and Rotate */

                var path   = new QVideo.Curve.Circle(mRadius);
                var points = path.getPoints(parts);
                var point  = points[position];

                // var deltaX = (point.x);
                // var deltaY = (point.y);
                // holderObj.rotateZ(Math.atan2(deltaY, deltaX));

                var step = 2 * Math.PI / parts;

                holderObj.rotateZ(Math.PI / 2);

                holderObj.rotateZ(step * position);

                holderObj.position.setX(point.x);
                holderObj.position.setY(point.y);

                // holderObj.translateZ(offsetZ);
                holderObj.translateZ(scope.opt.disc.depth / 2);

                holderGeo.computeBoundingBox();

                /* Add to Raycasting and Render */

                toRaycast.push(holderObj);
                scope.bodyGroup.add(holderObj);

                return holderObj;
            }

            function createIcon(material, text, visible, name) {
                var textGeo = new THREE.TextGeometry(text, textSett);
                textGeo.computeBoundingBox();

                var boxGeo = textGeo.boundingBox;
                var offset = boxGeo.getCenter().negate();

                var size  = boxGeo.getSize();
                var max   = Math.max(size.x, size.y);
                var scale = boxGeo.getSize().subScalar(max - textSett.size).divide(boxGeo.getSize());


                textGeo.translate(offset.x, offset.y * 1.1, 0);
                textGeo.scale(scale.x, scale.y, 1);

                var textObj           = new THREE.Mesh(textGeo, material);
                textObj.name          = name;
                textObj.visible       = visible;
                textObj.castShadow    = false;
                textObj.receiveShadow = false;
                textObj.renderOrder   = -1;

                return textObj;
            }


            /* BUTTONS */
            var buttonsUI = scope.buttonsUi;

            buttonsUI.btnResize = function (position) {
                // var textResizeSmall = String.fromCharCode("0xe801"); // Resize Small
                // var textResizeFull  = String.fromCharCode("0xe802"); // Resize Full
                var textResizeSmall = String.fromCharCode("0xe811"); // Resize Small
                var textResizeFull  = String.fromCharCode("0xe812"); // Resize Full

                var btnResize = createHolder(holdMat, position, 'btnResize');
                var iconSmall = createIcon(iconMat, textResizeSmall, false, 'iconSmall');
                var iconFull  = createIcon(iconMat, textResizeFull, true, 'iconFull');
                btnResize.add(iconSmall, iconFull);
                iconSmall.position.z = iconFull.position.z = btnResize.geometry.boundingBox.max.z;

                /* Function / Events */
                Object.defineProperty(btnResize, 'isFull', {
                    get: function () {
                        return this.children[0].visible || false; // small visible
                    },
                    set: function (isFull) {
                        var full     = this.children[1];
                        var small    = this.children[0];
                        full.visible = !(small.visible = isFull);
                    }
                });

                btnResize.onClick = function (isFull) {
                    console.log(this.name, "Click", isFull);
                };

                btnResize.internalClick = function () {
                    this.onClick(this.isFull = !this.isFull);
                };

                btnResize.internalMouseOver = function () {
                    if (scope.debugDom !== null) {
                        scope.debugDom.innerText += "\n\n" + "MouseOver: " + this.name + "\nFull: " + this.isFull;
                    }
                    this.children[0].material.opacity = 0.8;
                    this.children[1].material.opacity = 0.8;
                };

                function clear() {
                    this.material.opacity = 0.5;
                }

                iconSmall.onAfterRender = clear;
                iconFull.onAfterRender  = clear;

                // console.log(btnResize);

                return btnResize;

            }(13);

            buttonsUI.btnLoop = function (position) {
                var textLoop = String.fromCharCode("0xe809");

                var btnLoop  = createHolder(holdMat, position, 'btnLoop');
                var iconLoop = createIcon(iconMat.clone(), textLoop, true, 'iconLoop');
                btnLoop.add(iconLoop);
                iconLoop.position.z = btnLoop.geometry.boundingBox.max.z;

                btnLoop.userData.active = false;

                Object.defineProperty(btnLoop, 'isLoop', {
                    get: function () {
                        return btnLoop.userData.active;
                    },
                    set: function (value) {
                        btnLoop.userData.active = value;
                    }
                });


                btnLoop.onClick = function (isLoop) {
                    console.log(this.name, "Click", isLoop);
                };

                btnLoop.internalClick = function () {
                    this.onClick(this.isLoop = !this.isLoop);
                };

                btnLoop.internalMouseOver = function () {
                    if (!btnLoop.userData.active)
                        this.children[0].material.opacity = 0.8;
                };

                iconLoop.onAfterRender = function () {
                    if (!btnLoop.userData.active)
                        this.material.opacity = 0.5;
                    else this.material.opacity = 1;
                };


                return btnLoop;

            }(17);

            buttonsUI.btnConfig = function (position) {
                var ConfigInfo = String.fromCharCode("0xe80d");

                var btnConfig  = createHolder(holdMat, position, 'btnConfig');
                var iconConfig = createIcon(iconMat.clone(), ConfigInfo, true, 'iconConfig');
                btnConfig.add(iconConfig);
                iconConfig.position.z = btnConfig.geometry.boundingBox.max.z;

                btnConfig.onClick = function () {

                };

                btnConfig.internalClick = function () {
                    this.onClick();
                };

                btnConfig.internalMouseOver = function () {
                    this.children[0].material.opacity = 0.8;
                };

                iconConfig.onAfterRender = function () {
                    this.material.opacity = 0.5;
                };


                return btnConfig;

            }(15);
        }

        function CreateProgressBar() {
            // CreateTeste();

            /* MATERIAL ARRAY */
            var barMats = [];
            // Progress
            barMats[0]  = new THREE.MeshStandardMaterial({
                color:       scope.opt.progressBar.colorProg, // 0xe45105
                roughness:   0.65,
                metalness:   0.7,
                flatShading: false,
                side:        THREE.DoubleSide,
                transparent: true,
                opacity:     1
            });
            // Background
            barMats[1]  = new THREE.MeshStandardMaterial({
                color:       scope.opt.progressBar.colorBG, // 0xe45105
                roughness:   0.7,
                metalness:   0.7,
                flatShading: false,
                side:        THREE.DoubleSide,
                // blending: THREE.MultiplyBlending,
                // depthWrite:false,
                transparent: true,
                opacity:     0.2,
                visible:     true
            });
            // barMats[1] = materialAdv.wave;
            // Buffer
            barMats[2] = new THREE.MeshStandardMaterial({
                color:       scope.opt.progressBar.colorBuffer, // 0xe45105
                roughness:   0.5,
                metalness:   0.6,
                flatShading: false,
                side:        THREE.BackSide,
                // blending: THREE.MultiplyBlending,
                transparent: true,
                opacity:     0.3,
                visible:     true
            });
            // Hover
            barMats[3] = new THREE.MeshStandardMaterial({
                color:       scope.opt.progressBar.colorHover, // 0xe45105
                roughness:   0.7,
                metalness:   0.7,
                flatShading: false,
                side:        THREE.FrontSide,
                transparent: true,
                opacity:     0.2
            });

            // var barGroupsMat = new THREE.MultiMaterial(barMats);

            var border_size = scope.opt.disc.borderSize + scope.opt.disc.animWidthOpen;
            var outerRadius = scope.opt.disc.diameter / 2 - border_size;
            var innerRadius = outerRadius - scope.opt.disc.outerSize;

            var margin = scope.opt.progressBar.margin;

            var progSize = scope.opt.progressBar.width;

            var oRadius = innerRadius - margin / 2;
            var iRadius = innerRadius - progSize + margin / 2;
            var mRadius = innerRadius - progSize / 2;

            var depth = progSize / 2 - margin;


            /* UTILS */
            function createHolderGeo(durationSecs) {
                return new THREE.RingBufferGeometry(iRadius, oRadius, durationSecs, 1, Math.PI, 2 * Math.PI);
            }

            function createHolder(name, durationSecs) {
                var holderMat = new THREE.MeshBasicMaterial({
                    color:       0xff00b2,
                    side:        THREE.FrontSide,
                    transparent: true,
                    opacity:     0

                });


                var holderGeo           = createHolderGeo(durationSecs);
                var holderObj           = new THREE.Mesh(holderGeo, holderMat);
                holderObj.name          = name;
                holderObj.castShadow    = false;
                holderObj.receiveShadow = false;
                holderObj.renderOrder   = -1;

                toRaycast.push(holderObj);
                scope.bodyGroup.add(holderObj);

                return holderObj;
            }

            function createBarBufferGeo(durationSecs) {
                /* TEMP GEOMETRY */

                var precision = durationSecs;

                var step = 2 * Math.PI / (precision);

                var startAngle = Math.PI;

                var barGeoTemp = QGeo.torusAdv(mRadius, depth, 15, precision, 2 * Math.PI, 0, 2 * Math.PI, true);

                // var barGeoTemp = new THREE.Geometry();
                //
                // var rot = 0;
                // for (var c = 0; c < precision; c++) {
                //
                //     // var geometry = discGeometry2(oRadius, iRadius, depth*2, depth*2, 2, 0, step);
                //     // var geometry = new THREE.TorusGeometry(mRadius, depth, 16, 3, step);
                //     var geometry = geometrySolidTorus(mRadius, depth, 15, 3, step, (c == 0));
                //
                //     geometry.rotateZ(startAngle + rot);
                //
                //
                //     rot += step;
                //
                //
                //     barGeoTemp.merge(geometry);
                //
                // }
                // barGeoTemp.mergeVertices();

                /* BUFFER GEOMETRY */
                var bufferGeo = new THREE.BufferGeometry();

                bufferGeo.fromGeometry(barGeoTemp);

                barGeoTemp.dispose();

                var oneStep = bufferGeo.oneStep = bufferGeo.groups[0].count / precision;

                bufferGeo.clearGroups();
                bufferGeo.addGroup(0, 0, 0); // Progress Group
                // bufferGeo.addGroup(0, oneStep * precision, 1); // Background Group
                bufferGeo.addGroup(0, 0, 3); // Hover Group

                return bufferGeo;
            }

            function createBarContainer(name, durationSecs) {
                var bufferGeo = createBarBufferGeo(durationSecs);

                var obj           = new THREE.Mesh(bufferGeo, barMats);
                obj.name          = name;
                obj.castShadow    = true;
                obj.receiveShadow = false;
                obj.renderOrder   = -2;

                return obj;
            }

            function createBackground(name) {
                var offset = Math.PI / 15;

                var geo = QGeo.torusAdv(mRadius, depth + margin, 15, 100, 2 * Math.PI, -offset, Math.PI + offset * 2);

                var obj           = new THREE.Mesh(geo, barMats[1]);
                obj.name          = name;
                obj.castShadow    = false;
                obj.receiveShadow = true;
                obj.renderOrder   = -1;

                return obj;
            }


            /* CREATION */
            scope.progressBar = function () {
                var beginTime = Date.now();

                var holder = createHolder('progressBar', videoDuration);
                var bgObj  = createBackground('progressBG');
                var barObj = createBarContainer('progressContainer', videoDuration);
                holder.add(barObj, bgObj);


                holder.updateDuration = function () {
                    holder.geometry.dispose();
                    holder.geometry = createHolderGeo(videoDuration);

                    barObj.geometry.dispose();
                    barObj.geometry = createBarBufferGeo(videoDuration);

                };

                holder.updateCurrent = function () {
                    var oneStep = barObj.geometry.oneStep;

                    var index = Math.floor(videoCurrentTime * oneStep);

                    barObj.geometry.groups[0].start = 0;
                    barObj.geometry.groups[0].count = index;
                };

                holder.setBufferTime = function (startSec, endSec, position) {
                    var geo     = barObj.geometry;
                    var oneStep = barObj.geometry.oneStep;

                    var indexStart = Math.floor(startSec * oneStep);
                    var indexEnd   = Math.floor((endSec - startSec) * oneStep);
                    if (geo.groups[position + 2]) {
                        geo.groups[position + 2].start = indexStart;
                        geo.groups[position + 2].count = indexEnd;
                    } else
                        geo.addGroup(indexStart, indexEnd, 2);

                    if (scope.debugDom !== null) {
                        $("#debug3")[0].innerText = "Progress Groups: " + geo.groups.length;
                    }
                };

                holder.onMouseOver = function (seconds) {
                    if (scope.debugDom !== null) {
                        scope.debugDom.innerText += "\n\nProgress: " + seconds + " secs";
                    }
                };

                holder.internalMouseOver = function (intersection) {
                    var seconds = Math.round((intersection.faceIndex + 1) / 2);

                    var oneStep = barObj.geometry.oneStep;

                    barObj.geometry.groups[1].start = 0;
                    barObj.geometry.groups[1].count = seconds * oneStep;

                    this.onMouseOver(seconds);
                };

                holder.internalClick = function (intersection) {
                    var seconds = Math.round((intersection.faceIndex + 1) / 2);

                    var oneStep = barObj.geometry.oneStep;

                    barObj.geometry.groups[0].start = 0;
                    barObj.geometry.groups[0].count = seconds * oneStep;

                    this.onTimeChange(seconds);

                    // moveLight(seconds);
                };

                holder.onTimeChange = function (seconds) {
                    console.log("ProgressBar", "onTimeChange", seconds);
                };


                holder.onAfterRender = function () {
                    barObj.geometry.groups[1].start = 0;
                    barObj.geometry.groups[1].count = 0;

                    for (var c = 2; c < barObj.geometry.groups.length; c++) {
                        barObj.geometry.groups.pop();
                    }
                };

                // console.log("MS:", (Date.now() - beginTime));

                return holder;
            }();


        }

        function CreateVolumeIcons(material, textSettings, name) {
            var textVolOff  = String.fromCharCode("0xe80a"); // volume off
            var textVolDown = String.fromCharCode("0xe80b"); // volume down
            var textVolUp   = String.fromCharCode("0xe80c"); // volume up

            var overlayMat = new THREE.MeshBasicMaterial({
                color:       0xff00b2,
                side:        THREE.FrontSide,
                transparent: true,
                opacity:     0.0,
                visible:     false
            });

            var iconMat = material;

            var textSett = textSettings;


            /* UTILS */

            function createOverlay(material, name) {

                var holderGeo           = new THREE.BoxGeometry(1, 1, 1);
                var holderObj           = new THREE.Mesh(holderGeo, material);
                holderObj.name          = name;
                holderObj.castShadow    = false;
                holderObj.receiveShadow = false;
                holderObj.renderOrder   = -1;

                /* Translate and Rotate */

                // NOT YET

                /* Add to Raycasting and Render */

                // toRaycast.push(holderObj);
                // scope.bodyGroup.add(holderObj);

                return holderObj;
            }

            function createIcon(material, text, visible, name, scaleSize) {
                scaleSize = (scaleSize !== undefined) ? scaleSize : textSett.size;

                var textGeo = new THREE.TextGeometry(text, textSett);
                textGeo.computeBoundingBox();

                var boxGeo = textGeo.boundingBox;
                var offset = boxGeo.getCenter().negate();

                var size  = boxGeo.getSize();
                var max   = Math.max(size.x, size.y);
                var scale = boxGeo.getSize().subScalar(max - scaleSize).divide(boxGeo.getSize());


                textGeo.translate(offset.x, offset.y, offset.z);
                // textGeo.scale(scale.x, scale.y, 1);

                var textObj           = new THREE.Mesh(textGeo, material);
                textObj.name          = name;
                textObj.visible       = visible;
                textObj.castShadow    = true;
                textObj.receiveShadow = false;
                textObj.renderOrder   = 0;

                return textObj;
            }


            /* CREATION */
            var holder   = new QGroup(name);
            var overlay  = createOverlay(overlayMat, name + "Overlay");
            var iconOff  = createIcon(iconMat, textVolOff, false, 'btnVolOff');
            var iconDown = createIcon(iconMat, textVolDown, false, 'btnVolDown');
            var iconUp   = createIcon(iconMat, textVolUp, true, 'btnVolUp');

            holder.add(overlay, iconOff, iconDown, iconUp);

            function scaleOverlay(iconObj) {
                var bBox = iconObj.geometry.boundingBox;
                var size = bBox.getSize();

                overlay.scale.set(1, 1, 1);
                overlay.scale.set(size.x, size.y, size.z);

            }

            holder.setPercent = function (percent) {
                if (percent <= 0) {
                    iconOff.visible  = true;
                    iconDown.visible = false;
                    iconUp.visible   = false;
                    scaleOverlay(iconOff);
                } else if (percent <= 0.5) {
                    iconOff.visible  = false;
                    iconDown.visible = true;
                    iconUp.visible   = false;
                    scaleOverlay(iconDown);
                } else {
                    iconOff.visible  = false;
                    iconDown.visible = false;
                    iconUp.visible   = true;
                    scaleOverlay(iconUp);
                }
            };

            holder.centerOn = function (mesh) {
                var width = scope.opt.volumeBar.width;

                var bBox          = new THREE.Box3().setFromObject(mesh);
                holder.position.y = bBox.min.y + width * 2 + textSettings.height;

            };

            overlay.internalClick = function () {
                if (iconOff.visible) {
                    scope.volumePercent = data.volume;
                } else {
                    data.volume         = scope.volumePercent;
                    scope.volumePercent = 0;
                }
                scope.volumeBar.onVolumeChange(scope.volumePercent);
            };


            toRaycast.push(overlay);

            return holder;
        }

        function CreateVolumeBar() {
            var holderMat = new THREE.MeshBasicMaterial({
                color:       0xff00b2,
                side:        THREE.FrontSide,
                transparent: true,
                opacity:     0.0
            });

            var volMat = new THREE.MeshStandardMaterial({
                color:       0xff5500,
                // emissive: 0xffdee5,
                // emissiveIntensity: 0.1,
                roughness:   0.5,
                metalness:   0.6,
                // depthTest: true,
                // depthWrite: true,
                flatShading: true,
                side:        THREE.FrontSide,
                transparent: true,
                opacity:     1
            });

            var iconMat = new THREE.MeshStandardMaterial({
                color:             0xffffff,
                emissive:          0xffffff,
                emissiveIntensity: 0.2,
                roughness:         0.5,
                metalness:         0.9,
                flatShading:       true,
                side:              THREE.FrontSide
            });

            var textSett = {
                font:           fonts.icons,
                size:           scope.opt.buttons.volume.size,
                height:         scope.opt.buttons.volume.height,
                // curveSegments: 4,
                bevelEnabled:   true,
                bevelThickness: 0.1,
                bevelSize:      0.1,
                bevelSegments:  3,
                // material: 0,
                // extrudeMaterial: 1
            };

            var outerRadius = scope.opt.disc.diameter / 2;
            outerRadius -= scope.opt.disc.outerSize;
            outerRadius -= scope.opt.disc.borderSize + scope.opt.disc.animWidthOpen;
            // outerRadius -= scope.opt.volumeBar.width / 2;
            outerRadius -= scope.opt.volumeBar.margin;
            outerRadius -= scope.opt.progressBar.width;
            outerRadius -= 4;

            var width = scope.opt.volumeBar.width;
            var depth = scope.opt.volumeBar.depth;

            var offRad = scope.opt.volumeBar.offsetDegree * Math.PI / 180;
            var amount = scope.opt.volumeBar.amount;

            var phiStart  = offRad;
            var phiLength = Math.PI - offRad * 2;

            var percent = Math.round(scope.volumePercent * amount);

            var space = 2;


            /* UTILS */
            function createHolder(name) {
                var holderGeo           = QGeo.disc(outerRadius, outerRadius - width, depth, depth, amount, phiStart, phiLength, true, true);
                var holderObj           = new THREE.Mesh(holderGeo, holderMat);
                holderObj.name          = name;
                holderObj.castShadow    = false;
                holderObj.receiveShadow = false;
                holderObj.renderOrder   = 1;


                toRaycast.push(holderObj);
                scope.bodyGroup.add(holderObj);

                return holderObj;
            }

            function createVolumeGroup(name) {
                var items = new QGroup(name);

                var step = phiLength / amount / space;

                var s = 0;
                for (var c = 0; c < amount; c++) {
                    var geometry = QGeo.disc(outerRadius, outerRadius - width, depth, depth, 32, phiStart + s, step, true, true);

                    s += step * space;

                    var mesh = new THREE.Mesh(geometry, volMat.clone());

                    if (percent <= c) {
                        mesh.material.opacity = 0.2;
                    }

                    mesh.name = 'volItem' + (c + 1);

                    mesh.castShadow    = true;
                    mesh.receiveShadow = false;

                    items.add(mesh);
                }

                return items;
            }

            /* CREATION */
            scope.volumeBar = function () {
                var holder = createHolder('volumeBar');
                var items  = createVolumeGroup('volumeItens');
                var icons  = CreateVolumeIcons(iconMat, textSett, 'volumeBarIcons');
                holder.add(items, icons);

                icons.centerOn(holder);
                icons.setPercent(scope.volumePercent);

                var oneStep = (holder.geometry.faces.length) / amount;


                holder.setVolume = function (percent) {
                    percent = (percent >= 0 && percent <= 1) ? percent : 1;

                    var animDuration = 200;
                    var animStep     = animDuration / items.children.length;
                    var value        = percent * amount;

                    for (var c = 0; c < items.children.length; c++) {
                        if (c < value) {
                            setTimeout(function (i) {
                                items.children[i].material.opacity = 1;
                            }, animStep * c, c);
                        } else {
                            setTimeout(function (i) {
                                items.children[i].material.opacity = 0.2;
                            }, animDuration - animStep * c, c);
                        }
                    }
                    volumePercent = percent;
                    icons.setPercent(percent);
                };

                holder.onMouseOver = function (percent) {
                    if (scope.debugDom !== null) {
                        scope.debugDom.innerText += "\nVolume: " + percent;
                    }
                };

                holder.internalMouseOver = function (intersection) {
                    var value  = (intersection.faceIndex) / oneStep + 0.5;
                    var volume = Math.min(Math.round(value), amount);


                    if (scope.debugDom !== null) {
                        scope.debugDom.innerText += "\n\nVIndex: " + intersection.faceIndex;
                    }

                    for (var c = 0; c < volume; c++) {
                        if (items.children[c].material.opacity < 1) {
                            items.children[c].material.opacity = 0.5;
                        }
                    }

                    this.onMouseOver(volume / amount);
                };

                holder.onVolumeChange = function (percent) {
                    console.log("VolumeBar", "onVolumeChange", percent);
                };

                holder.internalClick = function (intersection) {
                    var value  = (intersection.faceIndex) / oneStep + 0.5;
                    var volume = Math.min(Math.round(value), amount);

                    this.setVolume(volume / amount);
                    this.onVolumeChange(volume / amount);

                };


                holder.onAfterRender = function () {
                    for (var c = 0; c < items.children.length; c++) {
                        if (items.children[c].material.opacity < 1) {
                            items.children[c].material.opacity = 0.2;
                        }
                    }

                };


                return holder;

            }();


        }


        function CreateLights() {
            var ambient_light = new THREE.AmbientLight(0xffffff, 1);
            scene.add(ambient_light);

            /* Spotlights */

            var spot_light = new THREE.SpotLight(0xffffff, 0.6);
            spot_light.position.set(0, 1, 210);

            spot_light.castShadow = true;

            spot_light.shadow.mapSize.width  = 4096;
            spot_light.shadow.mapSize.height = 4096;

            // spot_light.distance           = 5000;
            spot_light.penumbra           = 0;
            spot_light.decay              = 1;
            spot_light.shadow.camera.near = 0.5;
            spot_light.shadow.camera.far  = 1000;
            // spot_light.shadow.camera.fov  = 10;

            spot_light.angle = 1;

            scene.add(spot_light);
            // scene.add(new THREE.SpotLightHelper(spot_light));

            /* Directional Light */

            var light = new THREE.DirectionalLight(0xffffff, 0.35);
            light.position.set(0, 0, 210);

            light.castShadow = false;

            // light.shadow.mapSize.width  = 4096;
            // light.shadow.mapSize.height = 4096;
            // light.shadow.camera.near    = 0.5;
            // light.shadow.camera.far     = 10000;
            //
            // light.shadow.camera.left   = -1000;
            // light.shadow.camera.right  = 1000;
            // light.shadow.camera.top    = -1000;
            // light.shadow.camera.bottom = 1000;

            var target = new THREE.Object3D();
            target.position.set(0, -2, 0);
            light.target = target;

            scene.add(target);
            scene.add(light);


        }


        function doRaycasting() {
            dom.style.cursor = data.cursor;
            // data.hover       = false;

            if (data.animTimeout === null) {
                data.animTimeout = setTimeout(function () {
                    data.hover = false;
                }, 1000);
            }

            if (scope.debugDom !== null) {
                scope.debugDom.innerText = "Mouse X: " + mouse.x.toFixed(10) + "\n";
                scope.debugDom.innerText += "Mouse Y: " + mouse.y.toFixed(10) + "\n";
            }

            raycaster.setFromCamera(mouse, scope.camera);


            intersecs = raycaster.intersectObjects(toRaycast, false);

            // return;

            if (scope.debugDom !== null) {
                scope.debugDom.innerText += "\nIntersects: " + intersecs.length;
            }

            var oldSelected = selected;

            if (intersecs.length > 0) {
                data.hover = true;
                clearTimeout(data.animTimeout);
                data.animTimeout = null;

                if (scope.debugDom !== null) {
                    for (var c = 0; c < intersecs.length; c++) {
                        var object = intersecs[c].object;
                        scope.debugDom.innerText += "\n" + c + ": " + object.name;
                    }
                }

                if (intersecs.length > 1) {
                    dom.style.cursor = 'pointer';
                    var inter        = intersecs[0];
                    var obj          = inter.object;
                    if (obj.name === 'menuBox') {
                        inter = intersecs[1];
                        obj   = inter.object;
                    }
                    selected = obj;

                    if (obj.internalMouseOver !== undefined) {
                        obj.internalMouseOver(inter);
                    }

                    if (oldSelected != selected) {
                        if (oldSelected && oldSelected.internalMouseOut !== undefined) {
                            oldSelected.internalMouseOut();
                        }
                    }

                }
            }

            if (intersecs.length < 1) {
                if (oldSelected && oldSelected.internalMouseOut !== undefined) {
                    oldSelected.internalMouseOut();
                }
                selected = null;
            }


        }

        /* Events Hadlers */
        function handlerMouseMove(e) {
            e.preventDefault();
            if (!scope.enabled) return;

            var x = e.clientX - scope.canvas.offsetLeft;
            var y = e.clientY - scope.canvas.offsetTop;

            mouse.x = (x / dom.width) * 2 - 1;
            mouse.y = -(y / dom.height) * 2 + 1;
        }

        function handlerMouseDown(e) {
            e.preventDefault();
            var key = (e.keyCode || e.which);

            if (intersecs.length > 1 && key === 1) {
                var inter = intersecs[0];
                var obj   = inter.object;
                if (obj.name === 'menuBox') {
                    inter = intersecs[1];
                    obj   = inter.object;
                }

                var parent = obj.parent;

                if (obj.internalClick !== undefined) {
                    obj.internalClick(inter);
                }

            }
        }

        function handlerMouseUp(e) {
            e.preventDefault();
        }

        this.activateEvents = function (enabled) {
            if (enabled === undefined) enabled = true;
            if (enabled && !data.eventsEnabled) {
                data.eventsEnabled = true;
                data.cursor        = dom.style.cursor;

                dom.addEventListener('mousemove', handlerMouseMove, false);
                dom.addEventListener('mousedown', handlerMouseDown, false);
                // dom.addEventListener('mouseup', handlerMouseUp, false);
            } else if (!enabled && data.eventsEnabled) {
                data.eventsEnabled = false;
                dom.removeEventListener('mousemove', handlerMouseMove, false);
                dom.removeEventListener('mousedown', handlerMouseDown, false);
                // dom.removeEventListener('mouseup', handlerMouseUp, false);
            }
        };

        this.render = function (renderer) {
            if (this.enabled) {
                doRaycasting();
                var temp_disable = false;

                if (this.enableAnimation && !temp_disable) {
                    this.menuGroup.position.x += (-mouse.x * 0.09 * view.w - this.menuGroup.position.x) * 0.05;

                    if (data.hover && !this.hide) {
                        this.menuGroup.rotation.y += (-mouse.x * 0.3 - this.menuGroup.rotation.y) * 0.05;

                        this.bodyGroup.rotation.x += (0 - this.bodyGroup.rotation.x) * 0.05;
                        this.bodyGroup.position.y += (0 - this.bodyGroup.position.y) * 0.05;
                        // this.bodyGroup.position.y += -Easing.easeInOutQuad((0 - this.bodyGroup.position.y) * 0.5);
                    } else if (!this.hide) {
                        this.menuGroup.rotation.y += (-mouse.x * 0.1 - this.menuGroup.rotation.y) * 0.05;

                        this.bodyGroup.rotation.x += ((-68 * Math.PI / 180) - this.bodyGroup.rotation.x) * 0.05;
                        this.bodyGroup.position.y += (0.5 - this.bodyGroup.position.y) * 0.05;
                    } else {
                        this.bodyGroup.position.y += (0.6 - this.bodyGroup.position.y) * 0.05;

                        this.menuGroup.rotation.y += (-mouse.x * 0.1 - this.menuGroup.rotation.y) * 0.05;
                        this.bodyGroup.rotation.x += ((-68 * Math.PI / 180) - this.bodyGroup.rotation.x) * 0.05;

                    }

                }

                scope.loading.render();

                var autoClear      = renderer.autoClear;
                renderer.autoClear = false;
                renderer.clearDepth();
                renderer.render(scene, this.camera);
                renderer.autoClear = autoClear;
            }
        };

        this.create = function () {
            this.camera = new THREE.PerspectiveCamera(45, canvas.aspect, 1, 100000);
            this.camera.position.setZ(200); // 35

            view  = viewSize(this.camera, this.camera.position.z, false);
            scene = new THREE.Scene();


            /* Components */
            createBody();
            createTimeText();
            createChapterText();
            createLoadingAnimation();
            CreateButtonsMedia();
            CreateButtonsUI();
            CreateProgressBar();
            CreateVolumeBar();
            CreateLights();

            this.activateEvents();


            /* BACKGROUND */

            var bgMat         = new THREE.ShadowMaterial({opacity: 0.17});
            // var bgMat = new THREE.MeshPhongMaterial({color: 0xef2674, receiveShadow: true});
            bgMat.flatShading = true;

            var bgGeo           = new THREE.PlaneGeometry(1, 1, 1, 1);
            bgObj               = new THREE.Mesh(bgGeo, bgMat);
            bgObj.receiveShadow = true;
            bgObj.scale.set(view.w, view.h, 1);

            scene.add(bgObj);


            /* MENU BOX */

            var bodyBoundindBox = this.bodyGroup.boundingBox;
            var bodySize        = bodyBoundindBox.getSize();

            // console.log("Body Group Size", bodySize);

            var menuBoxGeo = new THREE.CylinderGeometry(bodySize.x / 2, bodySize.y / 2, bodySize.z + 0.0, 64);

            var menuBoxObj        = new THREE.Mesh(menuBoxGeo, new THREE.MeshBasicMaterial({
                color:       0xffff00,
                side:        THREE.FrontSide,
                transparent: true,
                opacity:     0.5,
                visible:     false
            }));
            menuBoxObj.name       = 'menuBox';
            menuBoxObj.rotation.x = -90 * Math.PI / 180;

            toRaycast.push(menuBoxObj);

            this.bodyGroup.add(menuBoxObj);


            this.menuGroup.add(this.bodyGroup);


            bgObj.position.z = bodyBoundindBox.min.x / 2;

            this.menuGroup.position.z = -20;

            // this.menuGroup.rotation.y = Math.PI/1.7;


            console.log(this.menuGroup.boundingBox);

            this.bodyGroup.scale.divideScalar(this.opt.disc.diameter);


            this.updateForWindowResize(true);


            // var tbox = new THREE.Box3().setFromObject(this.bodyGroup);
            // console.log(tbox, tbox.getSize(), tbox.getCenter());

            scene.add(this.menuGroup);
        };

        this.updateForWindowResize = function (first) {
            if (first === undefined) first = false;
            this.camera.aspect = this.canvas.aspect;
            this.camera.updateProjectionMatrix();

            view = viewSize(this.camera, this.camera.position.z, false);
            bgObj.scale.set(view.w * 3, view.h * 3, 1);

            // console.log('scale', scale1, scale2);

            var size   = scope.opt.disc.diameter;
            var aspect = view.w / this.canvas.w;
            // var scale  = aspect * size;
            var scale  = aspect * this.canvas.h - 2.5;

            if (first) {
                this.menuGroup.scale.set(scale, scale, scale);
            }


        };


    }


    return CircularMenu;

});