(function() {

if (!window.console) {
    window.console = { log: function() {} };
}

var Modal = ReactBootstrap.Modal;

var EventRow = React.createClass({
    getInitialState: function() {
        return {
            showAttendees: false,
            attendees: false
        };
    },
    render: function() {
        var event = this.props.data;
        var info = event.title.split(': ');
        var geo = event.geo || {};
        var geo_link = geo.address || "Unknown";
        if (geo.latitude && geo.longitude) {
            geo_link = <a href={'https://www.google.com/maps/?q=' + geo.latitude + ',' + geo.longitude} target="_blank">{geo_link}</a>;
        }
        var modal;
        if (this.state.showAttendees) {
            var attendees = <span className="no-attendees-warning">No attendees yet...</span>;
            if (this.state.attendees && this.state.attendees.length) {
                attendees = this.state.attendees.map(function(attendee) {
                    return (
                        <a key={attendee.ID} href={attendee.URL} target="_blank">
                            <img src={attendee.avatar_URL} width="32" height="32" />
                            {attendee.name}
                        </a>
                    );
                });
                attendees = <div className="attendee-list list-group">{attendees}</div>
            }
            modal = (
                <Modal show={this.state.showAttendees} onHide={this.closeAttendees}>
                    <Modal.Header closeButton>
                        <Modal.Title><span className="glyphicon glyphicon-user"></span> {info[1]} Attendees</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        {attendees}
                    </Modal.Body>
                    <Modal.Footer>
                        Attend?
                    </Modal.Footer>
                </Modal>
            );
        }
        return (
            <tr className={event.i_like ? 'success' : ''}>
                <td>{event.ID}</td>
                <td>{info[0]}</td>
                <td><a href={event.URL}>{info[1]}</a></td>
                <td>{geo_link}</td>
                <td dangerouslySetInnerHTML={{__html: event.excerpt}}></td>
                <td>
                    <a href="#" onClick={this.handleAttendeesClick}>{event.like_count}</a>
                    {modal}
                </td>
                <td><AttendingButton id={event.ID} attending={event.i_like} onAttendChange={this.onAttendChange} /></td>
            </tr>
        );
    },
    handleAttendeesClick: function(e) {
        e.preventDefault();
        this.setState({showAttendees: true});
        if (this.state.attendees === false) {
            Automeetic.site.post(this.props.data.ID).likesList({}, function(err, response) {
                this.setState({
                    attendees: response.likes,
                    attendees_found: response.found
                });
            }.bind(this));
            this.setState({attendees: []});
        }
    },
    closeAttendees: function(e) {
        this.setState({showAttendees: false});
    },
    onAttendChange: function(attending, attending_count) {
        this.props.data.i_like = attending;
        this.props.data.like_count = attending_count;
        this.forceUpdate();
    }
});

var AttendingButton = React.createClass({
    getInitialState: function() {
        return {
            attending: this.props.attending,
            working: false
        }
    },
    handleClick: function(e) {
        e.preventDefault();
        if (e.button !== 0 || this.state.working) {
            return;
        }
        var attending = this.state.attending;
        Automeetic.site.post(this.props.id).like()[attending ? 'del' : 'add'](function(err, data) {
            console.log('like change', data);
            if (err) throw err;
            this.setState({
                attending: !attending,
                working: false
            });
            if (this.props.onAttendChange) {
                this.props.onAttendChange(!attending, data.like_count);
            }
        }.bind(this));
        this.setState({working: true});
    },
    render: function() {
        var attrs = {
            className: 'btn btn-' + (this.state.attending ? 'danger' : 'primary'),
            title: Automeetic.me.ID ? '' : "You need to log in to sign up for an event",
            disabled: Automeetic.me.ID ? undefined : true,
            onClick: this.handleClick
        }
        return (<button {...attrs}>{this.state.attending ? 'Cancel' : 'Attend'}</button>);
    }
});

window.EventList = React.createClass({
    fetchEvents: function() {
        Automeetic.site.postsList({}, function(err, response) {
            if (err) throw err;
            this.setState({
                events: response.posts,
                found: response.found
            });
        }.bind(this));
    },
    getInitialState: function() {
        return {events: []};
    },
    componentDidMount: function() {
        this.fetchEvents();
    },
    render: function() {
        var events = this.state.events.map(function(event) {
            return <EventRow key={event.ID} data={event} />;
        });
        return (
            <table id="events" className="table table-striped">
            <thead>
                <tr><th>ID</th><th>Date</th><th>Title</th><th>Location</th><th>Description</th><th>Attendees</th><th>Action</th></tr>
            </thead>
            <tbody>{events}</tbody>
            </table>
        );
    }
});

window.LoginButton = React.createClass({
    getInitialState: function() {
        return {
            loggedin: false
        };
    },
    handleLogoutClick: function(e) {
        e.preventDefault();
        if (e.button === 0) {
            localStorage.removeItem('automeetic_access');
            location.reload();
        }
    },
    handleLoginClick: function(e) {
        e.preventDefault();
        if (e.button === 0) {
            wpcomBrowserAuth.redirect(Config.client_id);
        }
    },
    render: function() {
        if (this.state.loggedin) {
            return (
                <li id="logout"><a href="#" onClick={this.handleLogoutClick}><span className="user">{Automeetic.me.display_name || "Logout"}</span> <img src={Automeetic.me.avatar_URL || "https://s.w.org/about/images/logos/wordpress-logo-32-blue.png"} className="avatar" /></a></li>
            );
        }
        return (
            <li id="login"><a href="#" title="Connect with WordPress.com" onClick={this.handleLoginClick}><span>Login</span> <img src="https://s.w.org/about/images/logos/wordpress-logo-32-blue.png" className="avatar" /></a></li>
        );
    }
});

window.Automeetic = {
    me: {},

    init: function() {
        this.do_authentication();
        this.setup_api();

        this.render();
    },

    render: function() {
        this.event_list = ReactDOM.render(
            <EventList />,
            document.getElementById('automeetic')
        );
        this.login_button = ReactDOM.render(
            <LoginButton />,
            document.getElementById('loginbar')
        );
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
                        this.login_button.setState({
                            loggedin: false
                        });
                    }
                    throw err;
                }
                this.me = me;
                this.login_button.setState({
                    loggedin: true
                });
                this.event_list.forceUpdate();
                console.log('me', me);
            }.bind(this));
        }
    },
}

})();