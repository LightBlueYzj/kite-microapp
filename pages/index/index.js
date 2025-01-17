// 主页
// pages/index/index.js

import onShareAppMessage from "../../utils/onShareAppMessage";
import getHeader from "../../utils/getHeader";

const app = getApp();
const gData = app.globalData;

Page({
  data: {
    isLogin: gData.isLogin,
    clicked: -1, // 被点击功能的索引
    notice: [], // 通知
    items: [{
      text: "新生",
      url: "/freshman/pages/welcome/welcome",
      iconPath: "/assets/icons/index/freshman.png"
    }, {
      text: "电费",
      url: "/electricity/pages/show/show",
      iconPath: "/assets/icons/index/electricity.png"
    }, /* {
      text: "商城",
      url: "/shop/pages/index/index",
      iconPath: "/assets/icons/index/shop.png"
    }, 
    {
      text: "活动",
      url: "/activity/pages/index/index",
      iconPath: "/assets/icons/index/activity.png"
    }, */ {
      text: "空教室",
      url: "/class-room/pages/available-room",
      iconPath: "/assets/icons/index/availroom.png"
    },

    {
      text: "课表",
      url: "/timetable/pages/index/index",
      iconPath: "/assets/icons/index/timetable.png"
    },
    {
      text: "常用电话",
      url: "/contact/pages/show/show",
      iconPath: "/assets/icons/index/telephone.png"
    },
    {
      text: "成绩",
      url: "/score/pages/index/index",
      iconPath: "/assets/icons/index/score.png"
    }
    /* {
      text: "拼车",
      url: "/carpool/pages/car-pool/car-pool",
      iconPath: "/assets/icons/index/carpool.png"
    },
    {
      text: "搜索",
      url: "/search/pages/index/index",
      iconPath: "/assets/icons/index/search.png"
    } */
    ]

  },

  onShareAppMessage,

  goTemp() {
    wx.navigateTo({
      url: "/freshman/pages" + (
        gData.userDetail !== null
          ? "/stuInfoDetail/stuInfoDetail"
          : "/welcome/welcome"
      )
    });
  },

  setNotice(notice) {

    const noNotice = () => {
      this.setData({ notice: [{ id: -1, title: "暂无通知" }] });
      console.log("暂无通知");
    };

    if (Array.isArray(notice)) {

      if (notice.length > 0) {
        this.setData({ notice });
        console.groupCollapsed("%c通知数据", "font-weight: normal");
        notice.forEach( (item, index) => console.log(`通知 ${index}:`, item) );
        console.groupEnd();
      } else {
        noNotice();
      }

    } else {
      console.error("notice is not an Array", notice);
      noNotice();
    }

  },

  showNotice(e) {
    const notice = this.data.notice.find(
      item => item.id === e.target.dataset.id
    );
    notice !== undefined &&
    notice.title.length > 20 &&
    wx.showModal({
      title: "通知详情",
      content: notice.title,
      confirmText: "关闭",
      showCancel: false
    });
  },

  router(e) {

    // { index: Number, url: String }
    const dataset = e.currentTarget.dataset;

    // 设置被点击功能索引 clicked，为图标显示点击动画；一秒后重置
    this.setData({ clicked: dataset.index });
    setTimeout(() => this.setData({ clicked: -1 }), 1000);

    let url = dataset.url;

    // 如果点击“迎新”但是 userDetail 不为空，则直接跳转到 stuInfoDetail
    if (
      url === "/freshman/pages/welcome/welcome" &&
      gData.userDetail !== null
    ) {
      url = "/freshman/pages/stuInfoDetail/stuInfoDetail";
    }

    gData.isLogin
      // 已登录，跳转到目标页面
      ? wx.navigateTo({
        url,
        // 页面跳转失败时，显示未完成
        fail: () => wx.showModal({
          title: "尚未完成",
          content: "别急别急，正在努力开发~",
          confirmText: "知道了",
          showCancel: false
        })
      })
      // 未登录，提示用户登录
      : wx.showModal({
        title: "请登录",
        content: "尚未登录，请前往登录",
        success: res =>
          res.confirm &&
          wx.switchTab({ url: "/pages/user/user" })
      });

  },

  onLoad() {

    // 获取并设置通知 notice；目前不检查错误代码，所以直接用 wx.request()
    wx.request({
      url: `${gData.apiUrl}/notice`,
      header: getHeader("urlencoded", gData.token),
      success: res => this.setNotice(res.data.data),
      fail: console.error
    });

  },

  onShow() {
    this.data.isLogin !== gData.isLogin &&
    this.setData({ isLogin: gData.isLogin });
  }

})
