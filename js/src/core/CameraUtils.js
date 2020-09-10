define(function () {
    
    /**
     * Z position based on height
     * @param cam
     * @param height
     * @return {number}
     */
    function distance(cam, height) {
        return height / 2 / Math.tan(Math.PI * cam.fov / 360);
    }
    
    /**
     * Current camera view size based on z position.
     * @param {THREE.Camera} cam
     * @param {number} dist
     * @param {boolean} log
     * @return {{w: number, h: number, a: number, d: number}}
     */
    function viewSize(cam, dist, log) {
        if(log === undefined) log = false;

        var vFOV = cam.fov * Math.PI / 180;        // convert vertical fov to radians
        var height = 2 * Math.tan(vFOV / 2) * dist; // visible height
        
        var aspect = cam.aspect;
        var width = height * aspect;                  // visible width
        
        if (log) console.log("W: ", width, "\nH: ", height, "\nA: ", aspect, "\nD: ", dist);
        
        return {
            w: width,
            h: height,
            a: aspect,
            d: dist
        }
    }
    
    
    return {
        distance: distance,
        viewSize: viewSize
    }
    
});