require 'test_helper'

module SchemaDesigner
  class SchemaControllerTest < ActionController::TestCase
    test "should get index" do
      get :index
      assert_response :success
    end

  end
end
