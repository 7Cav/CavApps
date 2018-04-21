<script>
  module.exports = {
  extends: VueCharts.Line,
  props: ['data', 'options'],
    mounted () {
      this.renderChart(this.data, this.options)
    }
  }
</script>
