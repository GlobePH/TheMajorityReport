
<template>
    <div class="feeds-holder col l3 m4 p-0">
        <div class="feed-card">
            <div class="title">
                Recent Reports
            </div>
            <div class="body">
                <div v-for="(report, index) in reports">
                    <!-- Sample Report from Tweet -->
                    <div class="small-card" v-if="report.source == 'twitter'">
                        <div class="card-content">
                            <img :src="report.photo" class="w-100" style="height: auto;" v-if="report.photo">
                            <p @click="forceCenterMap(report)">
                                <span v-text="report.is_translated && report.translatedText ? report.translatedText : report.text"></span>
                                <!-- <br>
                                <a class="blue-text">#BPI</a> -->
                            </p>
                            <p class="right-align">
                                <b>@<span v-text="report.name"></span></b>    
                            </p>
                            <hr class="themed-hr">
                            <div class="right-align">
                                <a :href="'https://twitter.com/intent/tweet?in_reply_to='+report.tweet_id">
                                    Reply Tweet
                                </a>
                            </div>
                        </div>
                    </div>
                    <!-- Sample Report from SMS -->
                    <div class="small-card" v-if="report.source == 'sms'">
                        <div class="card-content">
                            <img :src="report.photo" class="w-100" style="height: auto;" v-if="report.photo">
                            <p @click="forceCenterMap(report)">
                                <span v-text="report.is_translated && report.translatedText ? report.translatedText : report.text"></span>
                                <br>
                            </p>
                            <p class="right-align">
                                <b><span v-text="report.name"></span></b>   
                            </p>
                        </div>
                    </div>
                    <!-- Sample Report from Web -->
                    <div class="small-card" v-if="report.source == 'web'">
                        <div class="card-content">
                            <img :src="report.photo" class="w-100" style="height: auto;" v-if="report.photo">
                            <p @click="forceCenterMap(report)">
                                <span v-text="report.is_translated && report.translatedText ? report.translatedText : report.text"></span>
                                <br>
                            </p>
                            <p class="right-align">
                                <b>&mdash; <span v-text="report.name"></span></b>
                               <!--  <br>
                                <p>
                                    Brgy. ABC, Mabuhay City
                                </p>    --> 
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
    export default {
        props: {
            reports: {
                type: Array
            }
        },

        data () {
            return {
            };
        },

        mounted() {

        },

        computed: {
            reversedReports() {
                return this.reports.reverse();
            }
        },

        methods: {
            forceCenterMap(report) {
                this.$emit('centermap', report);
            }
        },
    };
</script>