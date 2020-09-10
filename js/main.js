requirejs.config({
    baseUrl: 'js/src',
    paths:   {
        'jquery': '../libs/jquery-3.1.1',
        'libs':   '../libs',
        'text':   '../libs/text',
        'THREE':  '../libs/three/three-r88',
    },
    map:     {
        '*':                   {'jquery': 'libs/jquery-private'},
        'libs/jquery-private': {'jquery': 'jquery'}
    }

});

require(['QPlayer'], function (QPlayer) {


    var player = QPlayer("video1", {
        width:     1920,
        height:    800,
        autoplay:  false,
        loop:      true,
        startTime: 336, // 160 455
        volume:    0,
        subtitles: true,
        chapters:  false,
    });


    // player.version();

    // var player2 = new QPlayer("#video2", {
    //     width: 1280,
    //     height: 546,
    //     // width: 10000,
    //     // height: 10000,
    //     autoplay: false,
    //     loop: true,
    //     startTime: 401,
    //     volume: 0,
    //     subtitles: true,
    //     chapters: false
    // });

    // window.addEventListener("keyup", function key_watcher(event) {
    //     console.log(event["keyCode"]);
    // }, true);


});
