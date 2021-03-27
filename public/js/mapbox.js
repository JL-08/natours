/* eslint-disable */

export const displayMap = (locations) => {
  mapboxgl.accessToken =
    'pk.eyJ1IjoiamwwOCIsImEiOiJja21kaGExY2sya240Mm93MGUwNTdndDJ4In0.Wsvlb4qq6WnQhpezYGAUsQ';

  var map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/jl08/ckmdhq1omfobb17r1azob1hrm',
    scrollZoom: false,
    //   center: [-117.65278729840699, 34.358268483601755],
    //   zoom: 10,
    //   interactive: false,
  });

  // to figure out which portion of the map to display
  const bounds = new mapboxgl.LngLatBounds();

  locations.forEach((loc) => {
    // create marker
    const el = document.createElement('div');
    el.className = 'marker';

    // add marker
    new mapboxgl.Marker({
      element: el,
      anchor: 'bottom', // bottom of the marker
    })
      .setLngLat(loc.coordinates) // set coordinates
      .addTo(map);

    // add popup
    new mapboxgl.Popup({
      offset: 30,
    })
      .setLngLat(loc.coordinates)
      .setHTML(`<p>Day ${loc.day}: ${loc.description}</p>`)
      .addTo(map);

    // extends the map bounds to include current locations
    bounds.extend(loc.coordinates);
  });

  // executes the moving and zooming of bounds
  map.fitBounds(bounds, {
    padding: {
      top: 200,
      bottom: 150,
      left: 100,
      right: 100,
    },
  });
};
