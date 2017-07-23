<style scoped>
</style>
<template>
    <div>
        <div id="tag-cloud"></div>
    </div>
</template>

<script>
    export default {
        props: {
            reports: {
                type: Array,
                required: true,
            },
        },

        data() {
            return {
                words: [],
            };
        },

        mounted() {
            this.computeWordWeights();

            this.$nextTick(() => {
                if (this.words.length > 0) {
                    $('#tag-cloud').jQCloud(JSON.parse(JSON.stringify(this.words)), {
                        width: 500,
                        height: 350
                    });
                }
                
            });
        },

        watch: {
            reports() {
                this.computeWordWeights();

                this.$nextTick(() => {
                    if (this.words.length > 0) {
                        console.log('shit');
                        $('#tag-cloud').jQCloud('destroy');
                        $('#tag-cloud').jQCloud(JSON.parse(JSON.stringify(this.words)), {
                            width: 500,
                            height: 350
                        });
                        console.log('shit');
                    }
                });
            },
        },

        methods: {
            computeWordWeights() {
                this.words = [];

                _.map(this.reports, (report) => {
                    if (report.entities && report.entities.length > 0) {
                        _.map(_.map(report.entities, 'name'), (entity) => {
                            if (entity.slice(0, 1) != '#') {
                                const word = _.find(this.words, {
                                    text: entity
                                });
                                if (word) {
                                    console.log('defined!!!', word);
                                    ++word.weight;
                                } else {
                                    console.log('undefined!!',entity);
                                    this.words.push({
                                        text: entity,
                                        weight: 1,
                                    });
                                }
                            }
                        });
                    }
                });
            },
        },
    }
</script>
