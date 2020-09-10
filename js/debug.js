// console.log("Loaded", 'main-menu.js', ':)');


requirejs.config({
	baseUrl: 'js/src',
	paths: {
		libs: '../libs',
		jquery: '../libs/jquery-3.1.1',
		THREE: '../libs/three/THREE',
		three: '../libs/three'
	},
	shim: {
		'three/controls/OrbitControls': ['THREE']
	}
	
});


requirejs([
		'jquery',
		'THREE',
		'QPlayer',
		'QVideo',
		'QUtils',
		'CircularMenu',
		'three/controls/OrbitControls'
	],
	callback
);

function callback(j, T, QP, QVideo, QUtils, Menu) {
	QPlayer().version();
	
	var Mouse = {x: 0, y: 0};
	var mouse = new THREE.Vector2();
	
	var camera, scene, renderer;
	var controls;
	var canvas, fps;
	var loading, menu;
	
	var debug1    = $("#debug1")[0];
	var debug2    = $("#debug2")[0];
	var debug3    = $("#debug3")[0];
	var container = $('#content')[0];
	
	init();
	
	
	function init() {
		canvas            = new QUtils.Canvas(container, debug3);
		camera            = new THREE.PerspectiveCamera(45, canvas.aspect, 1, 100000);
		camera.position.z = 35;
		
		renderer = new THREE.WebGLRenderer({
			canvas: canvas.el,
			antialias: true,
			alpha: true
		});
		renderer.setClearColor(0x000000, 0);
		renderer.setPixelRatio(window.devicePixelRatio);
		renderer.setSize(canvas.w, canvas.h, false);
		renderer.shadowMap.enabled = true;
		renderer.shadowMap.type    = THREE.PCFSoftShadowMap;
		
		menu                 = new Menu(canvas);
		menu.enableAnimation = true;
		menu.debugDom        = debug2;
		menu.create();
		menu.videoDuration    = 5711;
		menu.videoCurrentTime = 1000;
		
		var screen = new QUtils.FullScreen();
		
		menu.buttonsUi.btnResize.onClick = function (isFull) {
			if (isFull) screen.setFullScreen(canvas.container);
			else screen.exitFullScreen();
		};
		
		
		// Preloader and Menu HERE
		loading = new QVideo.Preloader(canvas);
		loading.create();
		
		// controls         = new THREE.OrbitControls(camera, renderer.domElement);
		controls         = new THREE.OrbitControls(menu.camera, renderer.domElement);
		controls.enabled = false;
		controls.target.set(0, 0, 0);
		controls.update();
		
		fps = new QUtils.FPS();
		document.body.appendChild(fps.dom);
		
		
		scene = new THREE.Scene();
		
		var temp = new THREE.Mesh(new THREE.SphereGeometry(10), new THREE.MeshPhongMaterial({
			color: 0xffffff,
			transparent: true,
			opacity: 0.3
		}));
		// temp.renderOrder = 10;
		// scene.add(temp);
		$("#debug3").click(function () {
			loading.toogle();
		});
		
		// Lights
		scene.add(new THREE.AmbientLight(0xffffff));
		
		
		/* EVENTS */
		window.addEventListener('resize', onWindowResize, false);
		window.addEventListener('mousemove', onMouseMover, false);
		
		animate();
	}
	
	function animate() {
		requestAnimationFrame(animate);
		render();
		fps.update();
	}
	
	function render() {
		renderer.render(scene, camera);
		if (menu) {
			menu.progressBar.setBufferTime(100, 200, 0);
			menu.progressBar.setBufferTime(220, 280, 1);
			menu.progressBar.setBufferTime(2000, 4000, 2);
			
			menu.render(renderer);
		}
		if (loading) {
			loading.render(renderer);
		}
	}
	
	/* Events */
	
	function onWindowResize() {
		canvas.updateSize();
		
		camera.aspect = canvas.aspect;
		camera.updateProjectionMatrix();
		renderer.setSize(canvas.w, canvas.h, false);
		
		if (menu) menu.updateForWindowResize();
		if (loading) loading.updateForWindowResize();
	}
	
	function onMouseMover(e) {
		e.preventDefault();
		var offL = $(canvas.el).offset().left;
		var offT = $(canvas.el).offset().top;
		
		var x = e.clientX - offL;
		var y = e.clientY - offT;
		
		mouse.x = (x / canvas.w) * 2 - 1;
		mouse.y = -(y / canvas.h) * 2 + 1;
		
		if (x >= 0 && x <= canvas.w) {
			Mouse.x = (x - canvas.centerX);
		}
		if (y >= 0 && y <= canvas.h) {
			Mouse.y = (y - canvas.centerY);
		}
		
		var debug = $("#debug1")[0];
		
		debug.innerText = "Mouse X: " + x + "\n";
		debug.innerText += "Mouse Y: " + y + "\n\n";
		
		debug.innerText += "Mouse X: " + (Mouse.x) + "\n";
		debug.innerText += "Mouse Y: " + (Mouse.y) + "\n";
	}
	
}














