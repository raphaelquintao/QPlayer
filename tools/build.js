({
    "baseUrl": "../js/src",
    "paths":   {
        'jquery': '../libs/jquery-3.1.1',
        'libs':   '../libs',
        'text':   '../libs/text',
        'THREE':  '../libs/three/three-r88',
    },
    "map":     {
        '*':                   {'jquery': 'libs/jquery-private'},
        'libs/jquery-private': {'jquery': 'jquery'}
    },
    "name":    "QPlayer",
    "include": ["../../tools/almond.js"],
    // "exclude": ["jquery", "underscore"],
    "out":     "../js/build/QPlayer.js",
    "wrap":    {
        "startFile": "wrap.start",
        "endFile":   "wrap.end"
    }
})