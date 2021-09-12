// activity/pages/index/index.js
import { handlerGohomeClick, handlerGobackClick } from "../../../utils/navBarUtils";
import onShareAppMessage from "../../../utils/onShareAppMessage";
import getHeader from "../../../utils/getHeader";

const app = getApp();
const requestUtils = require("../../../utils/requestUtils");
const timeUtils = require("../../../utils/timeUtils")
const activityApiPrefix = `${app.globalData.apiUrl}/event`;
const header = getHeader("urlencoded", app.globalData.token);

const SWITCH_LIST = {
  ZERO: 0,
  ONE: 1,
  TWO: 2,
}

Page({

  /**
   * 页面的初始数据
   */
  data: {
    logined: null,
    verified: null,
    refresherTriggered: false,
    selected: '0',
    itemList: [],
    mineTotalList: [],
    mineScoreList: [],
    pageIndex: 800,
    showNotice: false,
    notice: "已经到底部了哦",
    option: {
      padding: 10,
      legend: {
        data: ['现有分数', '达标分数'],
        top: 5,
      },
      radar: {
        radius: "65%",
        indicator: [
            { name: '主题报告', max: 1.5},
            { name: '社会实践', max: 2},
            { name: '校园文化', max: 1},
            { name: '三创', max: 1.5},
            { name: '公益志愿', max: 1},
            { name: '安全文明', max: 1}
        ],
      },
      series: [{
          type: 'radar',
          data: [
              {
                  value: [1.0, 1.0, 1.0, 1.0, 1.0, 1.0],
                  name: '现有分数',
                  label: {
                    show: true,
                  }
              },
              {
                  value: [1.5, 2, 1, 1.5, 1, 1],
                  name: '达标分数',
                  label: {
                    show: true,
                  }
              }
          ]
      }]
    }
  },

  // 发请求获取初始活动列表
  getItemList() {
    let data = {};
    let url = activityApiPrefix + `?index=${this.data.pageIndex}`
    let getData = requestUtils.doGET(url, data, header);
    getData.then((res) => {
      console.log("开始请求");
      if(res.data.data[0] == null){
        this.setData({showNotice: true});
      }else {
        let itemList = this.data.itemList;
        let list = this.handleProperty(res);
        this.setData({itemList: itemList.concat(list)});
      }
    }).catch(() => {
      console.log("请求失败");
    })
  },

  // 对列表数组每一项的属性进行处理
  handleProperty(res) {
    let list = res.data.data;
    let regexp1 = /\u3010.+\u3011/g;
    let regexp2 = /[0-9]*.+日/g;
    let regexp3 = /日/;
    let regexp4 = /[0-9]*.+号/g;
    let regexp5 = /[0-9]*\u002e[0-9]*/g;
    let regexp6 = /[0-9]*\u002e[0-9]*\u002e[0-9]*/g;
    let regexp7 = /[0-9]*年/g;
    list[0].startTime = "2021-12-15T00:00:00"
    list.forEach(item => {
      item.title = item.title.replace(regexp1, "");
      let regexp3Index = item.title.search(regexp3)
      if(regexp3Index != -1) {
        if(item.title[regexp3Index + 1] != "常")
          item.title = item.title.replace(regexp2, "");
      }
      item.title = item.title.replace(regexp4, "");
      item.title = item.title.replace(regexp5, "");
      item.title = item.title.replace(regexp6, "");
      item.title = item.title.replace(regexp7, "");
      item.startTime = item.startTime.replace(/-/g, "/")
      item.endTime = item.endTime.replace(/-/g, "/")
      item.timeInterval = timeUtils.getIntervalToCurrentTime(item.startTime)
      if(timeUtils.getTimeStamp(item.startTime) / 1000 - parseInt(new Date().getTime() / 1000) > 0) {
        item.timeInterval += "后"
      }else {
        item.timeInterval += "前"
      }
    })
    return list;
  },

  // 滑倒底部获取接下来一页列表
  getNextPage() {
    if(!this.data.showNotice) {
      this.setData({pageIndex: this.data.pageIndex + 1});
      this.getItemList();
    }
  },

  // 点击活动跳转到详情
  toItemDetails(e) {
    let eventId = this.data.itemList[e.currentTarget.dataset.index].id;
    console.log(eventId)
    wx.navigateTo({
      url: `/activity/pages/detail/detail?eventId=${eventId}`,
    })
  },

  switch(e) {
    // console.log(e.detail.current)

    // 滑动时，e.currentTarget.dataset.selected没有定义
    if (e.currentTarget.dataset.selected === undefined) {
      if (this.data.logined) {
        // 校验认证状态
        if (!this.data.verified) {
          this.setData({selected: 0})
          this.jumpToVerify();
        } else {
          this.setData({selected: e.detail.current})
        }
      } else {
        this.setData({selected: e.detail.current})
      }
    } else if (this.data.logined) {
      // 校验认证状态
      if (!this.data.verified) {
          this.jumpToVerify();
      } else {
        this.setData({selected: e.currentTarget.dataset.selected})
      }
    } else {
      this.setData({selected: e.currentTarget.dataset.selected})
    }
    this.data.selected === SWITCH_LIST.TWO && this.data.mineScoreList.length === 0
      ? this.getScoreList(wx.getStorageSync('isActivityMinePageLatest'))
      : () => {}
  },

  // 跳转到认证界面
  jumpToVerify() {
    wx.navigateTo({
      url: '/pages/verify/verify',
    })
  },

  getScoreList(isLatest) {

    let isGetNew = typeof isLatest !== "boolean"
      ? true
      : !isLatest
    let url = activityApiPrefix + '/sc/score_detail?force=' + isGetNew
    let getData = requestUtils.doGET(url, {}, header)

    isGetNew
      ? wx.showLoading({
          title: '加载中2333~',
          mask: true
        })
      : {}

    getData.then(res => {

      wx.hideLoading()

      let mineScoreList = res.data.data.detail

      mineScoreList.forEach(item => {
        item.amount = item.amount.toFixed(1)
        item.time = item.time.replace(/-/g, " / ")
        item.time = item.time.replace(/T/g, " ")
        item.time = item.time.replace(/\+08:00/g, "")

      })

      this.setData({mineScoreList: mineScoreList})
      //拼接数组操作
      this.setData({mineTotalList: this.data.mineTotalList.concat(mineScoreList)})
      wx.setStorageSync('isActivityMinePageLatest', isGetNew)

    }).catch(err => {
      wx.showModal({
        title: "哎呀，出错误了 >.<",
        content:
          err.data.code != 1
            ? err.data.msg
            : "业务逻辑出错",
        showCancel: false,
        complete: err.data.code == 6
          ? () => {
            app.globalData.identity = {}
            app.globalData.verified = false
            wx.setStorageSync('verified', false)
            wx.setStorageSync('identity', {})
            wx.redirectTo({url: '/pages/verify/verify'})
          }
          : () => {}
      })
    })
  },

  // "我的" 下拉刷新
  refresh() {
    console.log("!")
    setTimeout(() => this.setData({refresherTriggered: false}), 2000)
    let date = new Date().getDate()
    console.log(date)
    // app.globalData.verified = false
    // app.globalData.identity = {}
    // wx.setStorageSync('identity', data)
    // wx.setStorageSync('verified', data)
    wx.showModal({
      showCancel: false,
      content: 'OA密码可能发生更改',
      complete: () => {
        this.jumpToVerify()
      }
    })
  },

  handlerGohomeClick,
  handlerGobackClick,
  onShareAppMessage,

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad () {
    this.getItemList();
    this.setData({
      logined: app.globalData.isLogin,
      verified: app.globalData.verified
    });
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady () {
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow () {

  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide () {

  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload () {

  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh () {

  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom () {

  }

})
