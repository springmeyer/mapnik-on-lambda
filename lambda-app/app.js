"use strict";

var mapnik = require('mapnik');
var path = require('path');

mapnik.register_datasource(path.join(mapnik.settings.paths.input_plugins,'postgis.input'));

exports.handler = async function(event, context) {
    var map = new mapnik.Map(256, 256);
    map.loadSync('./map.xml');
    const promise = new Promise(function(resolve, reject) {
      map.render(new mapnik.VectorTile(0, 0, 0), {}, function(err, vtile) {
        if (err) return reject(err);
        // For the simplicity of the example, let's return GeoJSON
        // that is pretty-printed and therefore easily viewed in a text editor.
        // So here we convert the first vector tile layer into an indented JSON string
        var out = JSON.parse(vtile.toGeoJSON(0));
        resolve(JSON.stringify(out,null,1));
      });
    });
    return promise;
}
