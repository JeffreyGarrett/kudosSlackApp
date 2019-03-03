provider "heroku" {
  email   = "${var.heroku_user_email}"
  api_key = "${var.heroku_api_key}"
}

resource "heroku_app" "kudos_app" {
  name   = "${var.app_name}"
  region = "${var.region}"

  config_vars {
    GB_Key               = "${var.GB_Key}"
    GIPHY_CLIENT_KEY     = "${var.giphy_client_key}"
    SENDGRID_KEY         = "${var.sendgrid_key}"
    SLACK_BOT_TOKEN      = "${var.slack_bot_token}"
    ADMIN_EMAIL          = "${var.admin_email}"
    FROM_EMAIL           = "${var.from_email}"
    SENDGRID_TEMPLATE_ID = "${var.sendgrid_template_id}"
    BASE_URL             = "http://${var.app_name}.herokuapp.com/"
    CULTURE_VALUES       = "${var.culture_values}"
  }

  buildpacks = [
    "heroku/nodejs",
  ]
  #acm = true
}

resource "heroku_addon" "database" {
  app  = "${heroku_app.kudos_app.name}"
  plan = "mongolab:sandbox"
}


resource "heroku_formation" "kudos_app" {
  app        = "${heroku_app.kudos_app.id}"
  type       = "web"
  quantity   = 1
  size       = "Standard-1x"
}
