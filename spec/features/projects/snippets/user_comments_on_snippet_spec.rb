require 'spec_helper'

describe 'Projects > Snippets > User comments on a snippet', :js do
  let(:project) { create(:project) }
  let!(:snippet) { create(:project_snippet, project: project, author: user) }
  let(:user) { create(:user) }

  before do
    project.add_maintainer(user)
    sign_in(user)

    visit(project_snippet_path(project, snippet))
  end

  it 'leaves a comment on a snippet' do
    page.within('.js-main-target-form') do
      fill_in('note_note', with: 'Good snippet!')
      click_button('Comment')
    end

    wait_for_requests

    expect(page).to have_content('Good snippet!')
  end

  it 'should have autocomplete' do
    find('#note_note').native.send_keys('')
    fill_in 'note[note]', with: '@'

    expect(page).to have_selector('.atwho-view')
  end

  it 'should have zen mode' do
    find('.js-zen-enter').click
    expect(page).to have_selector('.fullscreen')
  end
end
