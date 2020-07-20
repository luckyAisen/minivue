class Vue {
  constructor(options) {
    // 1、通过属性保存选择数据
    this.$options = options || {};
    this.$data = options.data || {};
    // 判断 options.el 是否是字符串，如果是字符串通过document.querySelector获取，如果不是就直接返回options.el
    this.$el =
      typeof options.el === "string"
        ? document.querySelector(options.el)
        : options.el;
    // 2、把 data 中的成员注入到vue实例中，并且转换成getter和setter
    this._proxyData(this.$data);
  }

  _proxyData(data) {
    // 通过Object.keys方法得到一个数组，并且循环当前这个数组调用Object.defineProperty转换成getter和setter
    Object.keys(data).forEach((key) => {
      Object.defineProperty(this, key, {
        enumerable: true,
        configurable: true,
        get() {
          return data[key];
        },
        set(newValue) {
          // 判断新的值和旧的值是否相同，如果相同不做处理
          if (newValue === data[key]) {
            return;
          }
          data[key] = newValue;
        },
      });
    });
  }
}
