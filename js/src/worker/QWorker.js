define([
    'text!libs/three/three-r88.min.js',
    'text!worker/worker_sub.js'
], function (three_text, worker_sub_text) {


    var worker_sub_blob   = new Blob([three_text + worker_sub_text]);
    var worker_sub_script = window.URL.createObjectURL(worker_sub_blob);





    return {
        Sub: new Worker(worker_sub_script)
    };
});


