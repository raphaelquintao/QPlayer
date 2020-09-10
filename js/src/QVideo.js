/*
 * QVideo
 */

define([
    'THREE', 'QUtils',
    'core/QGroup', 'core/Curves', 'core/Geometries', 'core/Shapes'
], function (THREE, QUtils, QGroup, Curves, TextRender, Geometries, Shapes) {
    
    
    
    
    var QVideo = {
        Shapes: Shapes,
        Curve: Curves,
        Geo: Geometries,
        Group: QGroup
    };
    
    return QVideo;
});




