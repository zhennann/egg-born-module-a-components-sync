export default {
  props: {
    ebHref: {
      type: [ String, Boolean ],
    },
    ebTarget: {
      type: String,
    },
  },
  watch: {
    ebHref(value) {
      this.$nextTick(() => {
        this.href = this.getHref(value);
      });
    },
  },
  data() {
    return {
      href: false,
    };
  },
  mounted() {
    // href
    this.href = this.getHref(this.ebHref);
    // class
    this.$$(this.$el).addClass('no-auto');
  },
  methods: {
    getHref(href) {
      if (!href) return href;
      const page = this.$page;
      if (!page || !page.$module) return href;
      return this.$meta.util.combinePagePath(page.$module.info, href);
    },
    onLinkClick(event) {
      if (!this.$$(this.$el).hasClass('no-auto')) return;
      const href = this.href;
      const target = this.ebTarget;
      if (!href) return;
      return this.$meta.vueLayout.navigate(href, { ctx: this, target });
    },
  },
};
