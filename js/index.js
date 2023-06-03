var Spectre = new Vue({
    el: '#Spectre',
    data() {
        var checkPhone = (rule, value, callback) => {
            if (!value) return false;
            let reg = /^1(3|5|7|8|9)\d{9}$/;
            if (!reg.test(value)) {
                callback(new Error('手机号码格式错误'));
            } else {
                callback();
            }
        };
        var checkEmail = (rule, value, callback) => {
            if (!value) return false;
            let reg = /^[a-z A-Z 0-9](\w|-)+@\w+\.[a-z A-Z]{2,4}$/;
            if (!reg.test(value)) {
                callback(new Error('邮箱格式错误'));
            } else {
                callback();
            }
        };
        return {
            userId: 0,
            userInfo: {},
            webService: 'https://autumnfish.cn/',
            nowMusicIndex: 0,
            navNum: 2,
            navlist: [{
                index: 0,
                title: '首页',
                icon: 'el-icon-s-home'
            }, {
                index: 1,
                title: '搜索歌曲',
                icon: 'el-icon-magic-stick'
            }, {
                index: 2,
                title: '播放列表',
                icon: 'el-icon-s-data'
            }, {
                index: 3,
                title: '小游戏',
                icon: 'el-icon-basketball'
            }, {
                index: 4,
                title: '关于我们',
                icon: 'el-icon-ship'
            }],
            banner: [],
            songName: '',
            singer: '',
            audio_src: '',
            album_pic: '',
            nowtime: '00:00',
            alltime: '00:00',
            login_dialog: false,
            login_Form: {
                phone: '',
                email: '',
                password: '',
            },
            ruleForm: {
                phone: [{ validator: checkPhone, trigger: 'blur' }],
                email: [{ validator: checkEmail, trigger: 'blur' }],
            },
            searchVal: '',
            myPlaylist: playlist,
            playlist: playlist,
            searchlist: [],
            runningday: parseInt((Date.parse(new Date()) - Date.parse("2020-02-19")) / (1000 * 60 * 60 * 24)),
            versions: 'v8.5 Beta',
            aboutfooter: new Date().getFullYear(),
        }
    },
    created() {
        axios.get(`${this.webService}banner`).then(res => {
            this.banner = res.data.banners;
        })
        if (localStorage.SpectreMusicPlayerUserId == '[]') return false;
        this.userId = JSON.parse(localStorage.SpectreMusicPlayerUserId);
    },
    methods: {
        login_btn(method) {
            if (!this.login_Form.password) return SpectreAlert('请输入手机/邮箱及密码');
            $.get(`${this.webService}login/cellphone?phone=${(method == 'phone' ? this.login_Form.phone : this.login_Form.email)}&password=${encodeURIComponent(this.login_Form.password)}`, res => {
                console.log(res)
                if (res.code == 502) {
                    SpectreAlert(res.msg)
                }
                if (res.code = 200) {
                    SpectreAlert(`登录成功！欢迎用户 ${res.profile.nickname}`)
                    this.userId = res.profile.userId;
                    localStorage.SpectreMusicPlayerUserId = JSON.stringify(this.userId);
                    window.location.reload();
                }
            }).fail(_ => {
                SpectreAlert('账号不存在')
            });
        },
        searchBtn() {
            if (!this.searchVal) return SpectreAlert('请输入搜索内容');
            SpectreAlert('搜索中...请稍等');
            this.searchlist = [];
            $("#searchlist .playlist").html('');
            axios.get(`${this.webService}search?keywords=${this.searchVal}`).then(res => {
                res.data.result.songs.forEach((item) => {
                    let singer = '';
                    item.artists.forEach((item, index) => {
                        index > 0 ? singer += ` / ${item.name}` : singer = item.name
                    });
                    this.searchlist.push({
                        src: item.id,
                        song: item.name,
                        singer: singer,
                    });
                });
                SpectreAlert('为您搜索到以下结果')
            }).catch(err => {

            })
        },
        SMP_getMusic(index) {
            $("#linenow").css('left', 0);
            $("#linebar").css('width', 0);
            this.getLyric(index);
            this.audio_src = `https://music.163.com/song/media/outer/url?id=${index}.mp3`;
            axios.get(`${this.webService}song/detail?ids=${index}`).then(res => {
                let singer = '';
                res.data.songs[0].ar.forEach((item, index) => {
                    index > 0 ? singer += ` / ${item.name}` : singer = item.name
                });
                this.album_pic = `${res.data.songs[0].al.picUrl}?param=120y120`;
                this.songName = res.data.songs[0].name;
                this.singer = singer;
                SpectreAlert(`正在播放：${res.data.songs[0].name} - ${singer}`);
            }).catch(_ => { });

        },
        beforeMusic() {
            if (--this.nowMusicIndex[1] < 0) this.nowMusicIndex[1] = this.playlist.length - 1;
            this.nowMusicIndex[0] = this.playlist[this.nowMusicIndex[1]].src;
            this.SMP_getMusic(this.playlist[this.nowMusicIndex[1]].src);
        },
        nextMusic() {
            if (++this.nowMusicIndex[1] == this.playlist.length) this.nowMusicIndex[1] = 0;
            this.nowMusicIndex[0] = this.playlist[this.nowMusicIndex[1]].src;
            this.SMP_getMusic(this.playlist[this.nowMusicIndex[1]].src);
        },
        playpause() {
            let audio = document.querySelector('#Spectre_audio');
            audio.paused ? audio.play() : audio.pause();
        },
        musicline() {
            let audio = document.querySelector('#Spectre_audio');
            let that = this;
            that.nowtime = that.conversion(audio.currentTime);
            if (that.conversion(audio.duration) == 'NaN:NaN') {
                that.alltime = '00:00';
            } else {
                that.alltime = that.conversion(audio.duration);
            }
            let width = audio.currentTime / audio.duration.toFixed(3) * 100 + '%';
            $('#linenow').css('left', width);
            $('#linebar').css('width', width);
        },
        conversion(value) {
            let minute = Math.floor(value / 60);
            minute = minute.toString().length === 1 ? ('0' + minute) : minute;
            let second = Math.round(value % 60);
            second = second.toString().length === 1 ? ('0' + second) : second;
            return `${minute}:${second}`;
        },
        getLyric(index) {
            $('#lyric').html('')
            $.get(`${this.webService}lyric?id=${index}`, (res) => {
                if (res.nolyric) return false;
                let oLRC = {
                    ti: "",
                    ar: "",
                    al: "",
                    by: "",
                    offset: 0,
                    ms: []
                };
                createLrcObj(res.lrc.lyric);
                function createLrcObj(lrc) {
                    if (lrc.length == 0) return;
                    let lrcs = lrc.split('\n');
                    for (let i in lrcs) {
                        lrcs[i] = lrcs[i].replace(/(^\s*)|(\s*$)/g, "");
                        let t = lrcs[i].substring(lrcs[i].indexOf("[") + 1, lrcs[i].indexOf("]"));
                        let s = t.split(":");
                        if (isNaN(parseInt(s[0]))) {
                            for (let i in oLRC) {
                                if (i != "ms" && i == s[0].toLowerCase()) {
                                    oLRC[i] = s[1];
                                }
                            }
                        } else {
                            let arr = lrcs[i].match(/\[(\d+:.+?)\]/g);
                            let start = 0;
                            for (let k in arr) {
                                start += arr[k].length;
                            }
                            let content = lrcs[i].substring(start);
                            for (let k in arr) {
                                let t = arr[k].substring(1, arr[k].length - 1);
                                let s = t.split(":");
                                oLRC.ms.push({
                                    t: (parseFloat(s[0]) * 60 + parseFloat(s[1])).toFixed(3),
                                    c: content
                                });
                            }
                        }
                    }
                    oLRC.ms.sort(function (a, b) {
                        return a.t - b.t;
                    });
                    for (let i in oLRC.ms) {
                        $(`<li>${oLRC.ms[i].c}</li>`).appendTo($('#lyric'))
                    }
                    let audio = document.querySelector('#Spectre_audio');
                    let lineNum = 0;
                    let preLine = 2;
                    let lineHeight = -24;
                    audio.ontimeupdate = function () {
                        for (let i in oLRC.ms) {
                            if (audio.currentTime > oLRC.ms[i].t) {
                                lineNum = i;
                            }
                        }
                        $(`#lyric>li:nth-child(${++lineNum})`).css({ 'color': 'rgb(0,166,233)', 'font-size': '20px', 'text-shadow': '0 0 1px blue' }).siblings().css({ 'color': '', 'font-size': '', 'text-shadow': '' })
                        if (lineNum > preLine) {
                            $('#lyric').stop(true, true).animate({ top: (lineNum - preLine) * lineHeight });
                        } else {
                            $('#lyric').css('top', 0);
                        }
                    }
                    audio.onended = function () {
                        $('#lyric').stop(true, true).css('top', '0');
                    }
                }
            })
        },
        selectNowMusicIndex(item) {
            if (item == 'playlist') {
                $('#playlist_box').animate({ scrollTop: $('#nowMusicIndex').attr('index') * 50 }, 500)
            }
            if (item = 'searchlist') {
                $('#searchlist_box').animate({ scrollTop: $('#nowMusicIndex').attr('index') * 50 }, 500)
            }
        },
        downloadMusic(src) {
            window.open(src)
        },
        more() {
            window.open(`https://music.163.com/#/song?id=${this.nowMusicIndex[0]}`)
        }
    },
    mounted() {

        if (this.userId != 0) {
            $.get(`${this.webService}user/detail?uid=${this.userId}`, res => {
                this.userInfo = res;
                $('#userId').after(`<div id="userInfo_content">
                    <div class="home_box_right" id="userInfo">
                        <img src="${this.userInfo.profile.avatarUrl}?param=50y50" style="margin-top:2px;width:45px;height:45px;border-radius: 50%;" />
                        <span>${this.userInfo.profile.nickname}</span>
                    </div>
                    <div id="userInfo_Box_mini">
                       <div style="width:100%;height: 100px;background:url(${this.userInfo.profile.backgroundUrl}?param=300y300) center center;"></div>
                       <div style="position:relative;z-index:5;margin:-40px auto;width:80px;height:80px;border-radius: 50%;background:url(${this.userInfo.profile.avatarUrl}?param=80y80);" />
                       <div id="userFollows"></div>
                       <p style="margin-bottom:5px;">${this.userInfo.profile.nickname}</p>
                       <small style="background:blue;color:white;padding:1px 5px;border-radius:3px;">Lv. ${res.level}</small>
                       <small style="background:#222;color:white;padding:1px 5px;border-radius:3px;">VIP ${res.profile.vipType}</small>
                       <ul id="userInfo_mini_control">
                        <li><i class="el-icon-user"></i> 个人主页</li>
                        <li><i class="el-icon-switch-button"></i> 退出登录</li>
                       </ul>
                    </div>
                </div>`).remove();
                $('#userInfo').mouseenter(_ => {
                    $('#userInfo_Box_mini').fadeIn('', _ => {
                        $('#userInfo_content').mouseleave(_ => {
                            $('#userInfo_Box_mini').fadeOut()
                        })
                    })
                });
                $('#userInfo_mini_control li').eq(1).click(_ => {
                    this.$confirm('此操作将只可体验本站部分功能, 是否继续?', '退出登录', {
                        confirmButtonText: '确认',
                        cancelButtonText: '取消',
                        type: 'warning',
                        center: true
                    }).then(_ => {
                        this.userId = 0;
                        localStorage.SpectreMusicPlayerUserId = JSON.stringify(this.userId);
                        window.location.reload();
                    }).catch(_ => { });
                })
            })
            $.get(`${this.webService}/user/follows?uid=${this.userId}`, res => {
                $('#userFollows').append(`<div class="userInfo_mini_followbtn" style="float:left;">关注<br/>${res.follow.length}</div>`)
            })
            $.get(`${this.webService}/user/followeds?uid=${this.userId}`, res => {
                $('#userFollows').append(`<div class="userInfo_mini_followbtn" style="float:right;">粉丝<br/>${res.followeds.length}</div>`)
            })
        }
        $("#timeline").click(function () {
            let audio = document.querySelector('#Spectre_audio');
            let coordnowtime = this.getBoundingClientRect().left;
            let coordalltime = event.pageX;
            let p = (coordalltime - coordnowtime) / this.offsetWidth;
            $("#linenow").css('left', `${p.toFixed(2) * 100}%`);
            $("#linebar").css('width', `${p.toFixed(2) * 100}%`);
            audio.currentTime = p * audio.duration;
            audio.play();
        });
        let timeline = document.querySelector('#timeline');
        let linebar = document.querySelector('#linenow');
        let musictimeline = setInterval(() => {
            Spectre.musicline()
        }, 100);
        let linebarleft = 0;
        linebar.onmousedown = function (event) {
            clearInterval(musictimeline);
            var event = event || window.event;
            let leftVal = event.clientX - this.offsetLeft;
            let that = this;
            document.onmousemove = function (event) {
                clearInterval(musictimeline);
                $('#linenow').css({ 'box-shadow': '0 0 5px blue', 'background': 'rgb(0,166,233)' });
                var event = event || window.event;
                linebarleft = event.clientX - leftVal;
                if (linebarleft < 0) {
                    linebarleft = 0;
                } else if (linebarleft > timeline.offsetWidth - linebar.offsetWidth) {
                    linebarleft = timeline.offsetWidth - linebar.offsetWidth;
                }
                $('#linebar').css('width', `${linebarleft}px`)
                that.style.left = linebarleft + "px";
                window.getSelection ? window.getSelection().removeAllRanges() : document.selection.empty();
            }
            document.onmouseup = function () {
                $('#linenow').css({ 'box-shadow': '', 'background': '#555' });
                clearInterval(musictimeline);
                document.onmousemove = null;
                musictimeline = setInterval(() => {
                    Spectre.musicline()
                }, 100);
            }
        }
        let audio = document.querySelector('#Spectre_audio');
        audio.onpause = _ => {
            $('#Spectre_play').removeClass().attr('class', 'el-icon-video-play');
        };
        audio.onplay = _ => {
            $('#Spectre_play').removeClass().attr('class', 'el-icon-video-pause');
        };
        audio.onended = _ => {
            Spectre.nextMusic()
        }
        this.playlist = this.myPlaylist;
        this.nowMusicIndex = [this.playlist[0].src, 0];
        this.SMP_getMusic(this.playlist[0].src);
    },
})

function SpectreAlert(msg) {
    if (!$('#SpectreAlert').length > 0) $(`<div id="SpectreAlert"><style>.SpectreAlertClose {position:absolute;top:50%;transform:translateY(-50%);right:10px;padding:10px 2px;transition:.3s}.SpectreAlertClose:hover {background: #eee;}.SpectreAlertClose:active {background: #ddd;}.SpectreAlertClose::before, .SpectreAlertClose::after {content: '';width: 14px;height: 1px;background: gray;display: block}.SpectreAlertClose::before {transform: rotate(45deg)}.SpectreAlertClose::after {transform: translateY(-1px) rotate(-45deg)}</style></div>`).css({ 'position': 'fixed', 'z-index': '99999', 'top': '100px', 'left': '50%', 'transform': 'translateX(-50%)' }).appendTo(document.body);
    $(`<div>${msg}<span class="SpectreAlertClose"></span></div>`).css({ 'width': '250px', 'display': 'none', 'padding': '8px 30px', 'background': '#fefafc', 'border': '1px solid #ddd', 'border-radius': '3px', 'box-shadow': '0 0 5px #eee', 'margin-bottom': '10px', 'text-align': 'center', 'color': '#777', 'position': 'relative', 'font-size': '13px', 'cursor': 'pointer' }).prependTo('#SpectreAlert').fadeToggle('slow', function () {
        $('.SpectreAlertClose').click(function () {
            $(this).parent().fadeToggle('fast', function () {
                $(this).remove()
            })
        })
        setTimeout(() => {
            $(this).fadeToggle('slow', function () {
                $(this).remove()
            })
        }, 3000);
    })
}