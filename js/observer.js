class Observer {
  // 这个构造函数接收一个data参数，这个data就是vue实例中的$data
  constructor(data) {
    // 默认执行一个函数，去解析
    this.walk(data);
  }

  walk(data) {
    // 1、判断data是否是对象
    if (!data || typeof data !== "object") {
      return;
    }
    // 2、遍历data对象的所有属性
    Object.keys(data).forEach((key) => {
      this.defineReactive(data, key, data[key]);
    });
  }
  // 定义响应式成员
  defineReactive(obj, key, value) {
    let that = this;
    // 如果value是对象，把value内部的属性转换成响应式数据
    this.walk(value);
    Object.defineProperty(obj, key, {
      enumerable: true,
      configurable: true,
      get() {
        return value;
      },
      set(newValue) {
        if (newValue === value) {
          return;
        }
        value = newValue;
        // 如果 newValue 是对象，设置 newValue 的成员为响应式
        that.walk(newValue);
      },
    });
  }
}
