<style scoped>
    #map{
        height: 100%;
        width: 100%;
    }
</style>
<template>
    <div id='map'>
        <company-map
            :company-key="companyKey"
            :map-center="mapCenter"
        ></company-map>
    </div>
</template>

<script>

    export default {
        props: {
            user: {
                type: Object,
                required: true,
            },

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
            };
        },

        beforeMount() {
            // commentsRef.on('child_added', (data) => {
            //     console.log(data.val());
            //     this.getReportsFromDb(data.key, data.val());
            //   // addCommentElement(postElement, data.key, data.val().text, data.val().author);
            // });

            // commentsRef.on('child_changed', (data) => {
            //     console.log(data.key);
            //   // setCommentValues(postElement, data.key, data.val().text, data.val().author);
            // });

            // commentsRef.on('child_removed', (data) => {
            //     console.log(data.key);
            //   // deleteComment(postElement, data.key);
            // });
        },

        mounted() {
            // alert(this.companyKey);
        },

        methods: {
        }
    }
</script>
