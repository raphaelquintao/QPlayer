define(['THREE'], function (THREE) {
    /**
     * Group with Bounding Box
     * @param {string} name
     * @exports QGroup
     * @class
     */
    function QGroup(name) {
        THREE.Object3D.call(this);
        
        this.name = (name !== undefined) ? name : '';
        this.type = 'QGroup';
        
        var bBox = null;
        
        Object.defineProperty(this, 'boundingBox', {
            get: function () {
                return (bBox === null) ? this.computeBoundingBox() : bBox;
            },
            set: function (value) {
                bBox = value;
            }
        });
    }
    
    QGroup.prototype = Object.assign(Object.create(THREE.Object3D.prototype), {
        constructor: QGroup,
        computeBoundingBox: function () {
            this.boundingBox = new THREE.Box3().setFromObject(this);
            return this.boundingBox;
        }
    });
    
    return QGroup;
});
