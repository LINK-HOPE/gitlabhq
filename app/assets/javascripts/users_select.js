/* eslint-disable func-names, space-before-function-paren, one-var, no-var, prefer-rest-params, wrap-iife, quotes, max-len, one-var-declaration-per-line, vars-on-top, prefer-arrow-callback, consistent-return, comma-dangle, object-shorthand, no-shadow, no-unused-vars, no-else-return, no-self-compare, prefer-template, no-unused-expressions, no-lonely-if, yoda, prefer-spread, no-void, camelcase, no-param-reassign */
/* global Issuable */

import eventHub from './sidebar/event_hub';

(function() {
  var bind = function(fn, me) { return function() { return fn.apply(me, arguments); }; },
    slice = [].slice;

  this.UsersSelect = (function() {
    function UsersSelect(currentUser, els) {
      var $els;
      this.users = bind(this.users, this);
      this.user = bind(this.user, this);
      this.usersPath = "/autocomplete/users.json";
      this.userPath = "/autocomplete/users/:id.json";
      if (currentUser != null) {
        if (typeof currentUser === 'object') {
          this.currentUser = currentUser;
        } else {
          this.currentUser = JSON.parse(currentUser);
        }
      }

      $els = $(els);

      if (!els) {
        $els = $('.js-user-search');
      }

      $els.each((function(_this) {
        return function(i, dropdown) {
          var options = {};
          var $block, $collapsedSidebar, $dropdown, $loading, $selectbox, $value, abilityName, assignTo, assigneeTemplate, collapsedAssigneeTemplate, defaultLabel, defaultNullUser, firstUser, issueURL, selectedId, selectedIdDefault, showAnyUser, showNullUser, showMenuAbove;
          $dropdown = $(dropdown);
          options.projectId = $dropdown.data('project-id');
          options.groupId = $dropdown.data('group-id');
          options.showCurrentUser = $dropdown.data('current-user');
          options.todoFilter = $dropdown.data('todo-filter');
          options.todoStateFilter = $dropdown.data('todo-state-filter');
          showNullUser = $dropdown.data('null-user');
          defaultNullUser = $dropdown.data('null-user-default');
          showMenuAbove = $dropdown.data('showMenuAbove');
          showAnyUser = $dropdown.data('any-user');
          firstUser = $dropdown.data('first-user');
          options.authorId = $dropdown.data('author-id');
          defaultLabel = $dropdown.data('default-label');
          issueURL = $dropdown.data('issueUpdate');
          $selectbox = $dropdown.closest('.selectbox');
          $block = $selectbox.closest('.block');
          abilityName = $dropdown.data('ability-name');
          $value = $block.find('.value');
          $collapsedSidebar = $block.find('.sidebar-collapsed-user');
          $loading = $block.find('.block-loading').fadeOut();
          selectedIdDefault = (defaultNullUser && showNullUser) ? 0 : null;
          selectedId = $dropdown.data('selected') || selectedIdDefault;

          const assignYourself = function () {
            const unassignedSelected = $dropdown.closest('.selectbox')
              .find(`input[name='${$dropdown.data('field-name')}'][value=0]`);

            if (unassignedSelected) {
              unassignedSelected.remove();
            }

            // Save current selected user to the DOM
            const input = document.createElement('input');
            input.type = 'hidden';
            input.name = $dropdown.data('field-name');

            const currentUserInfo = $dropdown.data('currentUserInfo');

            if (currentUserInfo) {
              input.value = currentUserInfo.id;
              input.dataset.meta = currentUserInfo.name;
            } else if (_this.currentUser) {
              input.value = _this.currentUser.id;
            }

            $dropdown.before(input);
          };

          if ($block[0]) {
            $block[0].addEventListener('assignYourself', assignYourself);
          }

          const checkMaxSelect = function() {
            const maxSelect = $dropdown.data('max-select');
            if (maxSelect) {
              const selected = getSelected();

              if (selected.length > maxSelect) {
                const firstSelectedId = selected[0];
                const firstSelected = $dropdown.closest('.selectbox')
                  .find(`input[name='${$dropdown.data('field-name')}'][value=${firstSelectedId}]`);

                firstSelected.remove();
                eventHub.$emit('sidebar.removeAssignee', {
                  id: firstSelectedId,
                });
              }
            }
          };

          const getSelectedUserInputs = function() {
            return $selectbox
              .find(`input[name="${$dropdown.data('field-name')}"]`);
          };

          const getSelected = function() {
            return getSelectedUserInputs()
              .map((index, input) => parseInt(input.value, 10))
              .get();
          };

          const getMultiSelectDropdownTitle = function(selectedUser, isSelected) {
            const selectedUsers = getSelected()
              .filter(u => u !== 0);

            const firstUser = getSelectedUserInputs()
              .map((index, input) => ({
                name: input.dataset.meta,
                value: parseInt(input.value, 10),
              }))
              .filter(u => u.id !== 0)
              .get(0);

            if (selectedUsers.length === 0) {
              return 'Unassigned';
            } else if (selectedUsers.length === 1) {
              return firstUser.name;
            } else if (isSelected) {
              const otherSelected = selectedUsers.filter(s => s !== selectedUser.id);
              return `${selectedUser.name} + ${otherSelected.length} more`;
            } else {
              return `${firstUser.name} + ${selectedUsers.length - 1} more`;
            }
          };

          $('.assign-to-me-link').on('click', (e) => {
            e.preventDefault();
            $(e.currentTarget).hide();

            if ($dropdown.data('multiSelect')) {
              assignYourself();
              checkMaxSelect();

              const currentUserInfo = $dropdown.data('currentUserInfo');
              $dropdown.find('.dropdown-toggle-text').text(getMultiSelectDropdownTitle(currentUserInfo)).removeClass('is-default');
            } else {
              const $input = $(`input[name="${$dropdown.data('field-name')}"]`);
              $input.val(gon.current_user_id);
              selectedId = $input.val();
              $dropdown.find('.dropdown-toggle-text').text(gon.current_user_fullname).removeClass('is-default');
            }
          });

          $block.on('click', '.js-assign-yourself', (e) => {
            e.preventDefault();
            return assignTo(_this.currentUser.id);
          });

          assignTo = function(selected) {
            var data;
            data = {};
            data[abilityName] = {};
            data[abilityName].assignee_id = selected != null ? selected : null;
            $loading.removeClass('hidden').fadeIn();
            $dropdown.trigger('loading.gl.dropdown');

            return $.ajax({
              type: 'PUT',
              dataType: 'json',
              url: issueURL,
              data: data
            }).done(function(data) {
              var user;
              $dropdown.trigger('loaded.gl.dropdown');
              $loading.fadeOut();
              if (data.assignee) {
                user = {
                  name: data.assignee.name,
                  username: data.assignee.username,
                  avatar: data.assignee.avatar_url
                };
              } else {
                user = {
                  name: 'Unassigned',
                  username: '',
                  avatar: ''
                };
              }
              $value.html(assigneeTemplate(user));
              $collapsedSidebar.attr('title', user.name).tooltip('fixTitle');
              return $collapsedSidebar.html(collapsedAssigneeTemplate(user));
            });
          };
          collapsedAssigneeTemplate = _.template('<% if( avatar ) { %> <a class="author_link" href="/<%- username %>"> <img width="24" class="avatar avatar-inline s24" alt="" src="<%- avatar %>"> </a> <% } else { %> <i class="fa fa-user"></i> <% } %>');
          assigneeTemplate = _.template('<% if (username) { %> <a class="author_link bold" href="/<%- username %>"> <% if( avatar ) { %> <img width="32" class="avatar avatar-inline s32" alt="" src="<%- avatar %>"> <% } %> <span class="author"><%- name %></span> <span class="username"> @<%- username %> </span> </a> <% } else { %> <span class="no-value assign-yourself"> No assignee - <a href="#" class="js-assign-yourself"> assign yourself </a> </span> <% } %>');
          return $dropdown.glDropdown({
            showMenuAbove: showMenuAbove,
            data: function(term, callback) {
              var isAuthorFilter;
              isAuthorFilter = $('.js-author-search');
              return _this.users(term, options, function(users) {
                // GitLabDropdownFilter returns this.instance
                // GitLabDropdownRemote returns this.options.instance
                const glDropdown = this.instance || this.options.instance;
                glDropdown.options.processData(term, users, callback);
              }.bind(this));
            },
            processData: function(term, users, callback) {
              let anyUser;
              let index;
              let j;
              let len;
              let name;
              let obj;
              let showDivider;
              if (term.length === 0) {
                showDivider = 0;
                if (firstUser) {
                  // Move current user to the front of the list
                  for (index = j = 0, len = users.length; j < len; index = (j += 1)) {
                    obj = users[index];
                    if (obj.username === firstUser) {
                      users.splice(index, 1);
                      users.unshift(obj);
                      break;
                    }
                  }
                }
                if (showNullUser) {
                  showDivider += 1;
                  users.unshift({
                    beforeDivider: true,
                    name: 'Unassigned',
                    id: 0
                  });
                }
                if (showAnyUser) {
                  showDivider += 1;
                  name = showAnyUser;
                  if (name === true) {
                    name = 'Any User';
                  }
                  anyUser = {
                    beforeDivider: true,
                    name: name,
                    id: null
                  };
                  users.unshift(anyUser);
                }

                if (showDivider) {
                  users.splice(showDivider, 0, 'divider');
                }

                if ($dropdown.hasClass('js-multiselect')) {
                  const selected = getSelected().filter(i => i !== 0);

                  if (selected.length > 0) {
                    if ($dropdown.data('dropdown-header')) {
                      showDivider += 1;
                      users.splice(showDivider, 0, {
                        header: $dropdown.data('dropdown-header'),
                      });
                    }

                    const selectedUsers = users
                      .filter(u => selected.indexOf(u.id) !== -1)
                      .sort((a, b) => a.name > b.name);

                    users = users.filter(u => selected.indexOf(u.id) === -1);

                    selectedUsers.forEach((selectedUser) => {
                      showDivider += 1;
                      users.splice(showDivider, 0, selectedUser);
                    });

                    users.splice(showDivider + 1, 0, 'divider');
                  }
                }
              }

              callback(users);
              if (showMenuAbove) {
                $dropdown.data('glDropdown').positionMenuAbove();
              }
            },
            filterable: true,
            filterRemote: true,
            search: {
              fields: ['name', 'username']
            },
            selectable: true,
            fieldName: $dropdown.data('field-name'),
            toggleLabel: function(selected, el, glDropdown) {
              const inputValue = glDropdown.filterInput.val();

              if (this.multiSelect && inputValue === '') {
                // Remove non-users from the fullData array
                const users = glDropdown.filteredFullData();
                const callback = glDropdown.parseData.bind(glDropdown);

                // Update the data model
                this.processData(inputValue, users, callback);
              }

              if (this.multiSelect) {
                return getMultiSelectDropdownTitle(selected, $(el).hasClass('is-active'));
              }

              if (selected && 'id' in selected && $(el).hasClass('is-active')) {
                $dropdown.find('.dropdown-toggle-text').removeClass('is-default');
                if (selected.text) {
                  return selected.text;
                } else {
                  return selected.name;
                }
              } else {
                $dropdown.find('.dropdown-toggle-text').addClass('is-default');
                return defaultLabel;
              }
            },
            defaultLabel: defaultLabel,
            hidden: function(e) {
              if ($dropdown.hasClass('js-multiselect')) {
                eventHub.$emit('sidebar.saveAssignees');
              }

              if (!$dropdown.data('always-show-selectbox')) {
                $selectbox.hide();

                // Recalculate where .value is because vue might have changed it
                $block = $selectbox.closest('.block');
                $value = $block.find('.value');
                // display:block overrides the hide-collapse rule
                $value.css('display', '');
              }
            },
            multiSelect: $dropdown.hasClass('js-multiselect'),
            inputMeta: $dropdown.data('input-meta'),
            clicked: function(options) {
              debugger
              const { $el, e, isMarking } = options;
              const user = options.selectedObj;

              if ($dropdown.hasClass('js-multiselect')) {
                const isActive = $el.hasClass('is-active');
                const previouslySelected = $dropdown.closest('.selectbox')
                    .find("input[name='" + ($dropdown.data('field-name')) + "'][value!=0]");

                // Enables support for limiting the number of users selected
                // Automatically removes the first on the list if more users are selected
                checkMaxSelect();

                if (user.beforeDivider && user.name.toLowerCase() === 'unassigned') {
                  // Unassigned selected
                  previouslySelected.each((index, element) => {
                    const id = parseInt(element.value, 10);
                    element.remove();
                  });
                  eventHub.$emit('sidebar.removeAllAssignees');
                } else if (isActive) {
                  // user selected
                  eventHub.$emit('sidebar.addAssignee', user);

                  // Remove unassigned selection (if it was previously selected)
                  const unassignedSelected = $dropdown.closest('.selectbox')
                    .find("input[name='" + ($dropdown.data('field-name')) + "'][value=0]");

                  if (unassignedSelected) {
                    unassignedSelected.remove();
                  }
                } else {
                  if (previouslySelected.length === 0) {
                  // Select unassigned because there is no more selected users
                    this.addInput($dropdown.data('field-name'), 0, {});
                  }

                  // User unselected
                  eventHub.$emit('sidebar.removeAssignee', user);
                }

                if (getSelected().find(u => u === gon.current_user_id)) {
                  $('.assign-to-me-link').hide();
                } else {
                  $('.assign-to-me-link').show();
                }
              }

              var isIssueIndex, isMRIndex, page, selected;
              page = $('body').data('page');
              isIssueIndex = page === 'projects:issues:index';
              isMRIndex = (page === page && page === 'projects:merge_requests:index');
              if ($dropdown.hasClass('js-filter-bulk-update') || $dropdown.hasClass('js-issuable-form-dropdown')) {
                e.preventDefault();

                const isSelecting = (user.id !== selectedId);
                selectedId = isSelecting ? user.id : selectedIdDefault;

                if (selectedId === gon.current_user_id) {
                  $('.assign-to-me-link').hide();
                } else {
                  $('.assign-to-me-link').show();
                }
                return;
              }
              if ($el.closest('.add-issues-modal').length) {
                gl.issueBoards.ModalStore.store.filter[$dropdown.data('field-name')] = user.id;
              } else if ($dropdown.hasClass('js-filter-submit') && (isIssueIndex || isMRIndex)) {
                return Issuable.filterResults($dropdown.closest('form'));
              } else if ($dropdown.hasClass('js-filter-submit')) {
                return $dropdown.closest('form').submit();
              } else if (!$dropdown.hasClass('js-multiselect')) {
                selected = $dropdown.closest('.selectbox').find("input[name='" + ($dropdown.data('field-name')) + "']").val();
                return assignTo(selected);
              }
            },
            id: function (user) {
              return user.id;
            },
            opened: function(e) {
              const $el = $(e.currentTarget);
              if ($dropdown.hasClass('js-issue-board-sidebar')) {
                selectedId = parseInt($dropdown[0].dataset.selected, 10) || selectedIdDefault;
              }
              $el.find('.is-active').removeClass('is-active');

              function highlightSelected(id) {
                $el.find(`li[data-user-id="${id}"] .dropdown-menu-user-link`).addClass('is-active');
              }

              if ($selectbox[0]) {
                getSelected().forEach(selectedId => highlightSelected(selectedId));
              } else {
                highlightSelected(selectedId);
              }
            },
            updateLabel: $dropdown.data('dropdown-title'),
            renderRow: function(user) {
              var avatar, img, listClosingTags, listWithName, listWithUserName, username;
              username = user.username ? "@" + user.username : "";
              avatar = user.avatar_url ? user.avatar_url : false;

              let selected = user.id === parseInt(selectedId, 10);

              if (this.multiSelect) {
                const fieldName = this.fieldName;
                const field = $dropdown.closest('.selectbox').find("input[name='" + fieldName + "'][value='" + user.id + "']");

                if (field.length) {
                  selected = true;
                }
              }

              img = "";
              if (user.beforeDivider != null) {
                `<li><a href='#' class='${selected === true ? 'is-active' : ''}'>${user.name}</a></li>`;
              } else {
                if (avatar) {
                  img = "<img src='" + avatar + "' class='avatar avatar-inline' width='32' />";
                }
              }

              return `
                <li data-user-id=${user.id}>
                  <a href='#' class='dropdown-menu-user-link ${selected === true ? 'is-active' : ''}'>
                    ${img}
                    <strong class='dropdown-menu-user-full-name'>
                      ${user.name}
                    </strong>
                    ${username ? `<span class='dropdown-menu-user-username'>${username}</span>` : ''}
                  </a>
                </li>
              `;
            }
          });
        };
      })(this));
      $('.ajax-users-select').each((function(_this) {
        return function(i, select) {
          var firstUser, showAnyUser, showEmailUser, showNullUser;
          var options = {};
          options.skipLdap = $(select).hasClass('skip_ldap');
          options.projectId = $(select).data('project-id');
          options.groupId = $(select).data('group-id');
          options.showCurrentUser = $(select).data('current-user');
          options.pushCodeToProtectedBranches = $(select).data('push-code-to-protected-branches');
          options.authorId = $(select).data('author-id');
          options.skipUsers = $(select).data('skip-users');
          showNullUser = $(select).data('null-user');
          showAnyUser = $(select).data('any-user');
          showEmailUser = $(select).data('email-user');
          firstUser = $(select).data('first-user');
          return $(select).select2({
            placeholder: "Search for a user",
            multiple: $(select).hasClass('multiselect'),
            minimumInputLength: 0,
            query: function(query) {
              return _this.users(query.term, options, function(users) {
                var anyUser, data, emailUser, index, j, len, name, nullUser, obj, ref;
                data = {
                  results: users
                };
                if (query.term.length === 0) {
                  if (firstUser) {
                    // Move current user to the front of the list
                    ref = data.results;
                    for (index = j = 0, len = ref.length; j < len; index = (j += 1)) {
                      obj = ref[index];
                      if (obj.username === firstUser) {
                        data.results.splice(index, 1);
                        data.results.unshift(obj);
                        break;
                      }
                    }
                  }
                  if (showNullUser) {
                    nullUser = {
                      name: 'Unassigned',
                      id: 0
                    };
                    data.results.unshift(nullUser);
                  }
                  if (showAnyUser) {
                    name = showAnyUser;
                    if (name === true) {
                      name = 'Any User';
                    }
                    anyUser = {
                      name: name,
                      id: null
                    };
                    data.results.unshift(anyUser);
                  }
                }
                if (showEmailUser && data.results.length === 0 && query.term.match(/^[^@]+@[^@]+$/)) {
                  var trimmed = query.term.trim();
                  emailUser = {
                    name: "Invite \"" + query.term + "\"",
                    username: trimmed,
                    id: trimmed
                  };
                  data.results.unshift(emailUser);
                }
                return query.callback(data);
              });
            },
            initSelection: function() {
              var args;
              args = 1 <= arguments.length ? slice.call(arguments, 0) : [];
              return _this.initSelection.apply(_this, args);
            },
            formatResult: function() {
              var args;
              args = 1 <= arguments.length ? slice.call(arguments, 0) : [];
              return _this.formatResult.apply(_this, args);
            },
            formatSelection: function() {
              var args;
              args = 1 <= arguments.length ? slice.call(arguments, 0) : [];
              return _this.formatSelection.apply(_this, args);
            },
            dropdownCssClass: "ajax-users-dropdown",
            // we do not want to escape markup since we are displaying html in results
            escapeMarkup: function(m) {
              return m;
            }
          });
        };
      })(this));
    }

    UsersSelect.prototype.initSelection = function(element, callback) {
      var id, nullUser;
      id = $(element).val();
      if (id === "0") {
        nullUser = {
          name: 'Unassigned'
        };
        return callback(nullUser);
      } else if (id !== "") {
        return this.user(id, callback);
      }
    };

    UsersSelect.prototype.formatResult = function(user) {
      var avatar;
      if (user.avatar_url) {
        avatar = user.avatar_url;
      } else {
        avatar = gon.default_avatar_url;
      }
      return "<div class='user-result " + (!user.username ? 'no-username' : void 0) + "'> <div class='user-image'><img class='avatar s24' src='" + avatar + "'></div> <div class='user-name'>" + user.name + "</div> <div class='user-username'>" + (user.username || "") + "</div> </div>";
    };

    UsersSelect.prototype.formatSelection = function(user) {
      return user.name;
    };

    UsersSelect.prototype.user = function(user_id, callback) {
      if (!/^\d+$/.test(user_id)) {
        return false;
      }

      var url;
      url = this.buildUrl(this.userPath);
      url = url.replace(':id', user_id);
      return $.ajax({
        url: url,
        dataType: "json"
      }).done(function(user) {
        return callback(user);
      });
    };

    // Return users list. Filtered by query
    // Only active users retrieved
    UsersSelect.prototype.users = function(query, options, callback) {
      var url;
      url = this.buildUrl(this.usersPath);
      return $.ajax({
        url: url,
        data: {
          search: query,
          per_page: 20,
          active: true,
          project_id: options.projectId || null,
          group_id: options.groupId || null,
          skip_ldap: options.skipLdap || null,
          todo_filter: options.todoFilter || null,
          todo_state_filter: options.todoStateFilter || null,
          current_user: options.showCurrentUser || null,
          push_code_to_protected_branches: options.pushCodeToProtectedBranches || null,
          author_id: options.authorId || null,
          skip_users: options.skipUsers || null
        },
        dataType: "json"
      }).done(function(users) {
        return callback(users);
      });
    };

    UsersSelect.prototype.buildUrl = function(url) {
      if (gon.relative_url_root != null) {
        url = gon.relative_url_root.replace(/\/$/, '') + url;
      }
      return url;
    };

    return UsersSelect;
  })();
}).call(window);
