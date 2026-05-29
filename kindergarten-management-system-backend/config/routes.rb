Rails.application.routes.draw do
  resources :attendances, only: [:index,:create]
  resources :disciplines,only: [:index, :show, :create, :update, :destroy]
  resources :parent_students, only: [:index, :create]
  resources :parents,only: [:index, :show, :create]
  resources :students
  resources :teachers,only: [:show]
  resources :classrooms, only: [:index, :show]
  post '/login', to: 'auth#create'
  post '/parent_login', to: 'parent_auth#create'
  post '/child_login', to: 'child_auth#create'
  post '/admin_login', to: 'admin_auth#create'
  get '/profile', to: 'teachers#profile'
  get 'teacher/parent/', to: 'teachers#classroom_parents'

  scope path: :admin, module: :admin_api, as: :admin do
    get '/profile', to: 'admins#profile'
    get '/summary', to: 'summary#index'
    resources :admins
    resources :teachers
    resources :classrooms
    resources :students
    resources :parents
    resources :parent_students, only: [:index, :create, :update, :destroy]
    resources :attendances, only: [:index, :destroy]
    resources :disciplines, only: [:index, :show, :create, :update, :destroy]
    resources :educational_videos
    resources :child_chat_sessions, only: [:index, :show]
  end

  scope path: :child, module: :child_api, as: :child do
    get '/profile', to: 'students#show'
    get '/students', to: 'students#index'
    get '/videos', to: 'videos#index'
    resources :chat_sessions, only: [:index, :show, :create] do
      resources :messages, only: [:create], controller: :chat_messages
    end
  end

  scope path: :parent, module: :parent_api, as: :parent_api do
    get '/children', to: 'children#index'
    get '/children/:student_id/chat_sessions', to: 'children#chat_sessions'
    patch '/children/:student_id/password', to: 'children#update_password'
  end
  # Define your application routes per the DSL in https://guides.rubyonrails.org/routing.html

  # Defines the root path route ("/")
  # root "articles#index"
end
