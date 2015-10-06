
if (!window.console) {
    window.console = { log: function() {} };
}

var Automeetic = {
    me: {},

    init: function() {
        this.do_authentication();
        this.setup_api();
        this.fetch_events();
    },

    fetch_events: function() {
        this.site.postsList({}, function(err, posts) {
            if (err) throw err;

            var t = $('#events');
            if (posts.found > 0) {
                posts.posts.forEach(function(post) {
                    t.append(this.render_event_row(post));
                }.bind(this));
                if (posts.found > posts.posts.length) {
                    // TODO
                    t.after("More...");
                }
            } else {
                t.replaceWith("No events found");
            }
        }.bind(this));
    },

    render_event_row: function(post) {
        console.log('post', post);
        var info = post.title.split(': ');
        var geo = post.geo || {};
        var geo_link = geo.address || "Unknown";
        if (geo.latitude && geo.longitude) {
            geo_link = $('<a href="https://www.google.com/maps/?q=' + geo.latitude + ',' + geo.longitude + '" target="_blank">').text(geo_link);
        }

        var row = $('<tr>')
            .append($('<td>').text(post.ID))
            .append($('<td>').text(info[0]))
            .append($('<td>').append($('<a>', {href: post.URL, text: info[1]})))
            .append($('<td>').append(geo_link))
            .append($('<td>').html(post.excerpt))
            .append($('<td class="attendees">').append($('<a href="#">').text(post.like_count).click(function(e) {
                e.preventDefault();
                this.display_likes_for_post(post);
            }.bind(this))))
            ;
        var attend_button = $('<button class="btn">').on('click', function(e) {
            e.preventDefault();
            if (e.which !== 1) {
                return;
            }
            if (attend_button.hasClass('working')) {
                return;
            }
            attend_button.addClass('working');
            if (attend_button.hasClass('btn-danger')) {
                this.site.post(post.ID).like().del(function(err, data) {
                    console.log('like del', data);
                    if (err) throw err;
                    attend_button.removeClass('btn-danger working').addClass('btn-primary').text("Attend")
                        .closest('tr').removeClass('success')
                        .find('.attendees a').text(data.like_count);
                });
            } else {
                this.site.post(post.ID).like().add(function(err, data) {
                    console.log('like add', data);
                    if (err) throw err;
                    attend_button.removeClass('btn-primary working').addClass('btn-danger').text("Cancel")
                        .closest('tr').addClass('success')
                        .find('.attendees a').text(data.like_count);
                });
            }
        }.bind(this));
        if (!this.me.ID) {
            attend_button.prop('disabled', true).attr('title', "You need to log in to sign up for an event");
        }
        if (post.i_like) {
            // attending
            row.addClass('success');
            attend_button.text('Cancel').addClass('btn-danger');
        } else {
            attend_button.text('Attend').addClass('btn-primary');
        }
        row.append($('<td>').append(attend_button));
        return row;
    },

    display_likes_for_post: function(post) {
        $('#attendeesModal')
            .find('.event-name').text(post.title.split(': ')[1]).end()
            .modal();
        this.site.post(post.ID).likesList({}, function(err, likes) {
            console.log('likes', likes);
            if (likes.found == 0) {
                $('#attendeesModal')
                    .find('.attendee-list').hide().end()
                    .find('.no-attendees-warning').show().end()
                    ;
                return;
            }
            var list = $('#attendeesModal')
                .find('.no-attendees-warning').hide().end()
                .find('.attendee-list').empty().show();
            for (var i = 0; i < likes.likes.length; i++) {
                var like = likes.likes[i];
                var row = $('<a>', {href: like.URL, target:"_blank"});
                row.append($('<img>', {src: like.avatar_URL, width:32, height:32}));
                row.append(like.name);
                list.append(row);
            }
            if (likes.found > likes.likes.length) {
                // TODO
                t.after("More...");
            }
        });
    },

    do_authentication: function() {
        // when the Redirect URL is invoked with the access_token,
        // then the `response()` function will return an Object.
        var response = wpcomBrowserAuth.response();
        if (response) {
            console.log('storing', response);
            localStorage.setItem('automeetic_access', JSON.stringify(response));
            window.location = location.href.replace(/\#.*$/, '');
        }
    },

    setup_api: function() {
        var access = JSON.parse(localStorage.getItem('automeetic_access')) || {};
        this.api = WPCOM(access.access_token);

        this.site = this.api.site(Config.host_site);
        this.current_user = this.api.me();

        this.site.get(function(err, me) {
            if (err) throw err;
            console.log('site', me);
        });

        if (access.access_token) {
            this.current_user.get(function(err, me) {
                if (err) {
                    if (err.statusCode === 403) {
                        localStorage.removeItem('automeetic_access');
                        this.display_login_button(false);
                    }
                    throw err;
                }
                this.me = me;
                this.display_login_button(true);
                console.log('me', me);
            }.bind(this));
        }

        this.display_login_button(access.access_token);
    },

    display_login_button: function(loggedin) {
        if (loggedin) {
            // remove Connect button
            $('#login').hide();
            $('#logout').show().on('click', function(e) {
                e.preventDefault();
                if (e.which === 1) {
                    localStorage.removeItem('automeetic_access');
                    location.reload();
                }
            });
            if (this.me.avatar_URL) {
                $('#logout img').attr('src', this.me.avatar_URL).addClass('avatar');
                $('#logout span').text(this.me.display_name);
            }
        } else {
            // called when the WP.com "Connect" button is clicked.
            $('#login').on('click', function(e) {
                e.preventDefault();
                if (e.which === 1) {
                    wpcomBrowserAuth.redirect(Config.client_id);
                }
            });
            $('#logout').hide();
        }
    }
}
