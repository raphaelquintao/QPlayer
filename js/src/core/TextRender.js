define([
    'THREE',
    'core/QGroup',
    'core/Fonts',
    'worker/QWorker'
], function (THREE, QGroup, Fonts, QWorker) {

    /**
     * Text Render for subtitles
     * @param qcanvas
     * @param fontURL
     * @constructor
     */
    function TextRender(qcanvas, fontURL) {
        var canvas = qcanvas;
        var camera, scene, view;


        var dSettings = {
            size:           6,
            height:         1.3,
            bevelThickness: 0.15,
            bevelSize:      0.15,
            pos_z:          12
        };

        var tSettings = {
            font:           null,
            size:           6,
            height:         2.5,
            curveSegments:  6,
            bevelEnabled:   true,
            bevelThickness: 0.15,
            bevelSize:      0.15,
            bevelSegments:  5
        };

        /* OBJECTS */
        var textGroup;
        var bgObj;
        var spotLight;

        var textMat = new THREE.MeshPhongMaterial({
            color:       0xffffff,
            flatShading: true
        });

        /* CONTROL */

        var currentText    = "";
        var enabledShadows = true;


        /* PROPERTIES */

        this.enabled = true;

        this.mouse = new THREE.Vector2(0, 0);

        Object.defineProperties(this, {
            /**
             * Font size percetage, between 0.3 and 2
             * @type {Number}
             */
            fontSize:       {
                get: function () {
                    return tSettings.size / dSettings.size;
                },
                set: function (value) {
                    if (value < 0.3 || value > 2) return;
                    tSettings.size = dSettings.size * value;
                    if (textGroup) setText(currentText);
                }
            },
            fontColor:      {
                get: function () {
                    return textMat.color.getHex();
                },
                set: function (value) {
                    textMat.color.setHex(value);
                }
            },
            enabledShadows: {
                get: function () {
                    return enabledShadows;
                },
                set: function (value) {
                    enabledShadows = value;
                    if (spotLight) spotLight.castShadow = enabledShadows;
                }
            }
        });


        this.render = function (renderer) {
            if (this.enabled) {
                var autoClear      = renderer.autoClear;
                renderer.autoClear = false;
                renderer.clearDepth();
                if (textGroup !== undefined) {
                    textGroup.position.x += (this.mouse.x * 0.02 * view.w - textGroup.position.x) * 0.05;
                    textGroup.rotation.y += (this.mouse.x * 0.03 - textGroup.rotation.y) * 0.05;
                    textGroup.rotation.x += (-this.mouse.y * 0.13 - textGroup.rotation.x) * 0.05;
                }

                renderer.render(scene, camera);
                renderer.autoClear = autoClear;
            }
        };

        this.updateForWindowResize = function () {
            camera.aspect = canvas.aspect;
            camera.updateProjectionMatrix();

            view = viewSize(camera, camera.position.z, false);
            bgObj.scale.set(view.w, view.h, 1);
        };

        this.updateText = function (text) {
            currentText = text;
            if (tSettings.font != null) {
                QWorker.Sub.postMessage({
                    'text':     text,
                    'textSett': tSettings
                });
            }
        };


        /* INTERNALS */

        function create() {
            camera            = new THREE.PerspectiveCamera(45, canvas.aspect, 0.1, 10000);
            camera.position.z = 200;

            view = viewSize(camera, camera.position.z, false);

            scene = new THREE.Scene();

            var bgMat = new THREE.ShadowMaterial({opacity: 0.8});

            var bgGeo = new THREE.PlaneGeometry(1, 1, 1, 1);
            bgObj     = new THREE.Mesh(bgGeo, bgMat);
            bgObj.scale.set(view.w, view.h, 1);
            bgObj.receiveShadow = true;
            scene.add(bgObj);


            spotLight            = new THREE.SpotLight(0xffffff, 1);
            spotLight.castShadow = enabledShadows;
            spotLight.position.set(0, 0, 165);
            spotLight.angle = 0.945;

            spotLight.shadow.camera.near = 1;
            spotLight.shadow.camera.far  = 200;
            spotLight.shadow.camera.fov  = 10;

            scene.add(spotLight);


            var loader = new THREE.FontLoader();
            loader.load(fontURL, function (font) {
                tSettings.font = font;
                createTextGroup();
            }, undefined, function () {
                tSettings.font = Fonts.helvetiker;
                createTextGroup();
            });

        }

        function createTextGroup() {
            textGroup = new QGroup();

            textGroup.position.z = (tSettings.height + tSettings.bevelThickness * 2 + dSettings.pos_z);
            scene.add(textGroup);
        }

        QWorker.Sub.addEventListener('message', function (e) {
            if (textGroup && e.data.buffers) {
                var buffers = e.data.buffers;

                for (var c in buffers) {
                    var geo_data = buffers[c];

                    var tempGeo, tempObj;

                    if (!textGroup.children[c]) {
                        tempGeo               = new THREE.BufferGeometry();
                        tempObj               = new THREE.Mesh(tempGeo, textMat);
                        tempObj.castShadow    = true;
                        tempObj.receiveShadow = false;
                        textGroup.add(tempObj);
                    } else {
                        tempGeo = textGroup.children[c].geometry;
                        tempObj = textGroup.children[c];
                    }

                    tempGeo.addAttribute('position', new THREE.BufferAttribute(geo_data.vertices, 3));
                    tempGeo.addAttribute('normal', new THREE.BufferAttribute(geo_data.normals, 3));


                    tempObj.visible = true;

                    tempObj.position.y = -(tSettings.size + tSettings.size * 0.43) * c;
                }

                for (var i = buffers.length; i < textGroup.children.length; i++)
                    textGroup.children[i].visible = false;


                textGroup.position.y = -view.h / 2 + ((tSettings.size + tSettings.size * 0.43) * buffers.length);
                textGroup.position.y += dSettings.pos_z / 2 - tSettings.size * 0.3;

            }


        }, false);


        /* UTILS */

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


        create();
    }


    return TextRender;
});