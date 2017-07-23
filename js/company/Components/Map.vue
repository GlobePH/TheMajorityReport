
<template>
    <gmap-map
        :center="mapCenter"
        :zoom="5"
        style="width: 100%; height: 100%"
        @bounds_changed="getRadiusOfMap"
        @center_changed="changeMapCenter"
    >
    <gmap-info-window :options="infoOptions" :position="infoWindowPos" :opened="infoWinOpen" :content="infoContent" @closeclick="infoWinOpen=false"></gmap-info-window>

        <gmap-cluster :max-zoom="50">
            <gmap-marker
                :key="index"
                v-for="(m, index) in mapPins"
                :position="{lat: parseFloat(m.coordinates.latitude), lng: parseFloat(m.coordinates.longitude) }"
                :clickable="true" @click="toggleInfoWindow(m,index)"
            ></gmap-marker>
        </gmap-cluster>
        <!-- :clickable="true"
            :draggable="true"
            @click="center=m.coordinates" -->
    </gmap-map>
</template>

<script>
    import * as VueGoogleMaps from 'vue2-google-maps';
    import Vue from 'vue';

    Vue.use(VueGoogleMaps, {
        load: {
            key: 'AIzaSyA6WAMFkf_-1ZSGHy7JfPVLfyN1s4eyro0',
            libraries: 'geometry'
        // libraries: 'places', //// If you need to use place input
        }
    });

    export default {
        props: {
            // reports: {
            //     type: Object,
            // },

            companyKey: {
                type: String,
                required: true,
            },

            mapCenter: {
                type: Object,
                required: true,
            }
        },

        data () {
            return {
                center: {
                    lat: 11.5563841,
                    lng: 118.0615091
                },

                radius: 0,
                debouncedGetRadiusOfMap: null,
                mapPins: {},

                infoContent: '',
                infoWindowPos: {
                    lat: 0,
                    lng: 0
                },
                infoWinOpen: false,
                currentMidx: null,
                //optional: offset infowindow so it visually sits nicely on top of our marker
                infoOptions: {
                    pixelOffset: {
                        width: 0,
                        height: -35
                    }
                },
            };
        },

        mounted() {
            $(window).resize(() => {
                this.$gmapDefaultResizeBus.$emit('resize');
            });

            const commentsRef = firebase.database().ref('reports');
            
            commentsRef.on('child_added', (data) => {
                if(this.companyKey != ''){
                    const geofireRef = firebase.database().ref('geofire/' + this.companyKey);
                    const geoFire = new GeoFire(geofireRef);
                    // console.log(data.val());
                    let newObj = Object.assign({}, data.val());
                    _.forEach(newObj, (value, key) => {
                        let locations= [];
                        if (value.coordinates) {
                            locations.push(parseFloat(value.coordinates.latitude));
                            locations.push(parseFloat(value.coordinates.longitude)); 
                            geoFire.set(key, locations);
                        }
                    });
                }
            });

            commentsRef.on('child_removed', (data) => {
                // console.log(data.key);
            });
        },

        methods: {
            convertToPlainObject(obj) {
                return JSON.parse(JSON.stringify(obj));
            },

            getRadiusOfMap(event) {
                if (!this.debouncedGetRadiusOfMap) {
                    this.debouncedGetRadiusOfMap = _.debounce((event) => {
                        if(event.b.f && event.f.f) {
                            let _kCord = new google.maps.LatLng(event.f.f, event.b.f);
                            const center = this.convertToPlainObject(this.center);
                            let _pCord = new google.maps.LatLng(center.lat, center.lng);

                            // google map returns radius in meters while geofire uses radius in kilometers
                            
                            this.radius = google.maps.geometry.spherical.computeDistanceBetween(_kCord, _pCord) / 1000;

                            this.fetchPinsFromServer();    
                        }
                    }, 500);
                }
                
                this.debouncedGetRadiusOfMap(event);
            },

            fetchPinsFromServer() {
                const geofireRef = firebase.database().ref('geofire/' + this.companyKey);
                const geoFire = new GeoFire(geofireRef);
                let mapCenter = this.convertToPlainObject(this.center);
                // alert(this.companyKey)
                const geoQuery = geoFire.query({
                    center: [
                        mapCenter.lat,
                        mapCenter.lng,
                    ],
                    radius: this.radius,
                });

                geoQuery.on('key_entered', (key, location, distance) => {
                    // alert(key);
                    if (!this.mapPins[key]) {
                        firebase.database().ref('reports/'+ this.companyKey + '/' + key).once('value').then((snapshot) => {
                            // this.$set(this.reports, key, snapshot.val());
                            let newObj = Object.assign({}, snapshot.val());
                            // console.log(newObj);
                            if ( newObj.coordinates ) {
                                newObj.coordinates.latitude = parseFloat(newObj.coordinates.latitude);
                                newObj.coordinates.longitude = parseFloat(newObj.coordinates.longitude);
                                this.$set(this.mapPins, key, newObj);
                            }
                        });                         
                        
                    }
                });

                this.geoQuery = geoQuery;
            },

            convertToNumber(coordinate) {
                return {
                    latitude: parseFloat(coordinate.latitude),
                    longitude: parseFloat(coordinate.longitude)
                };
            },


          toggleInfoWindow(marker, idx) {
            this.infoWindowPos = {
                    lat: marker.coordinates.latitude,
                    lng: marker.coordinates.longitude,
                };
            
            this.infoContent = marker.text;
            //check if its the same marker that was selected if yes toggle
            if (this.currentMidx == idx) {
              this.infoWinOpen = !this.infoWinOpen;
            }
            //if different marker set infowindow to open and reset current marker index
            else {
                this.infoWinOpen = true;
                this.currentMidx = idx;
            }
          },

          changeMapCenter(event) {
                this.mapCenter.lat = event.lat();
                this.mapCenter.lng = event.lng();
          }
        }
    }
</script>
