locals {
    task_role_arn                = aws_iam_role.gp2gp.arn
    task_execution_role          = "arn:aws:iam::${data.aws_caller_identity.current.account_id}:role/${var.environment}-${var.component_name}-EcsTaskRole"
    task_ecr_url                 = "${data.aws_caller_identity.current.account_id}.dkr.ecr.${var.region}.amazonaws.com"
    task_log_group               = "/nhs/deductions/${var.environment}-${data.aws_caller_identity.current.account_id}/${var.component_name}"
    environment_variables        = [
      { name = "GP2GP_ADAPTOR_REPOSITORY_ODS_CODE", value = data.aws_ssm_parameter.GP2GP_ADAPTOR_REPOSITORY_ODS_CODE.value },
      { name = "GP2GP_ADAPTOR_REPOSITORY_ASID", value = data.aws_ssm_parameter.GP2GP_ADAPTOR_REPOSITORY_ASID.value },
      { name = "NODE_ENV", value = var.environment },
      { name = "GP2GP_ADAPTOR_MHS_QUEUE_NAME", value = "raw-inbound" },
      { name = "GP2GP_ADAPTOR_MHS_QUEUE_URL_1", value = data.aws_ssm_parameter.stomp-endpoint_0.value },
      { name = "GP2GP_ADAPTOR_MHS_QUEUE_URL_2", value = data.aws_ssm_parameter.stomp-endpoint_1.value },
      { name = "GP2GP_ADAPTOR_MHS_OUTBOUND_URL", value = data.aws_ssm_parameter.GP2GP_ADAPTOR_MHS_OUTBOUND_URL.value },
      { name = "GP2GP_ADAPTOR_MHS_ROUTE_URL", value = "https://route.mhs.${var.environment}.non-prod.patient-deductions.nhs.uk" },
      { name = "NHS_NUMBER_PREFIX", value = data.aws_ssm_parameter.nhs_number_prefix.value }
    ]
    secret_environment_variables = [
      { name = "GP2GP_ADAPTOR_AUTHORIZATION_KEYS", valueFrom = data.aws_ssm_parameter.gp2gp_adaptor_authorization_keys.arn },
      { name = "GP2GP_ADAPTOR_MHS_QUEUE_USERNAME", valueFrom = data.aws_ssm_parameter.amq-username.arn },
      { name = "GP2GP_ADAPTOR_MHS_QUEUE_PASSWORD", valueFrom = data.aws_ssm_parameter.amq-password.arn },
    ]
}

resource "aws_ecs_task_definition" "task" {
  family                    = var.component_name
  network_mode              = "awsvpc"
  requires_compatibilities  = ["FARGATE"]
  cpu                       = var.task_cpu
  memory                    = var.task_memory
  execution_role_arn        = local.task_execution_role
  task_role_arn             = local.task_role_arn


  container_definitions  =  templatefile("${path.module}/templates/ecs-task-def.tmpl", {
        container_name        = "${var.component_name}-container",
        ecr_url               = local.task_ecr_url,
        image_name            = "deductions/${var.component_name}",
        image_tag             = var.task_image_tag,
        cpu                   = var.task_cpu,
        memory                = var.task_memory,
        container_port        = var.port,
        host_port             = var.port,
        log_region            = var.region,
        log_group             = local.task_log_group,
        environment_variables = jsonencode(local.environment_variables),
        secrets               = jsonencode(local.secret_environment_variables)
    })

  tags = {
    Environment = var.environment
    CreatedBy = var.repo_name
  }
}
