resource "aws_vpc" "shopsphere_vpc" {

  cidr_block           = "10.0.0.0/16"
  enable_dns_support   = true
  enable_dns_hostnames = true

  tags = {
    Name        = "shopsphere-vpc"
    Environment = "dev"
    Project     = "Shopsphere"
  }

}


resource "aws_internet_gateway" "shopsphere_igw" {

  vpc_id = aws_vpc.shopsphere_vpc.id

  tags = {

    Name        = "shopsphere-igw"
    Environment = "dev"
    Project     = "Shopsphere"

  }


}


resource "aws_subnet" "public_1" {

  vpc_id                  = aws_vpc.shopsphere_vpc.id
  cidr_block              = "10.0.1.0/24"
  availability_zone       = "ap-south-1a"
  map_public_ip_on_launch = true

  tags = {
    Name = "shopsphere-public-subnet-1"
    Type = "Public"

  }

}


resource "aws_subnet" "public_2" {

  vpc_id                  = aws_vpc.shopsphere_vpc.id
  cidr_block              = "10.0.2.0/24"
  availability_zone       = "ap-south-1b"
  map_public_ip_on_launch = true

  tags = {
    Name = "shopsphere-public-subnet-2"
    Type = "Public"

  }

}



resource "aws_route_table" "public" {

  vpc_id = aws_vpc.shopsphere_vpc.id

  route {

    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.shopsphere_igw.id

  }

  tags = {

    Name = "shopsphere-public-route-table"
  }


}


resource "aws_route_table_association" "public_1" {

  subnet_id      = aws_subnet.public_1.id
  route_table_id = aws_route_table.public.id

}


resource "aws_route_table_association" "public_2" {

  subnet_id      = aws_subnet.public_2.id
  route_table_id = aws_route_table.public.id

}


resource "aws_subnet" "private_1" {

  vpc_id                  = aws_vpc.shopsphere_vpc.id
  cidr_block              = "10.0.11.0/24"
  availability_zone       = "ap-south-1a"
  map_public_ip_on_launch = false

  tags = {
    Name = "shopsphere-private-subnet-1"
    Type = "Private"

  }
}


resource "aws_subnet" "private_2" {

  vpc_id                  = aws_vpc.shopsphere_vpc.id
  cidr_block              = "10.0.12.0/24"
  availability_zone       = "ap-south-1b"
  map_public_ip_on_launch = false

  tags = {
    Name = "shopsphere-private-subnet-2"
    Type = "Private"

  }
}


resource "aws_route_table" "private" {

  vpc_id = aws_vpc.shopsphere_vpc.id

  tags = {

    Name = "shopsphere-private-route-table"
  }

}


resource "aws_route_table_association" "private_1" {
  subnet_id      = aws_subnet.private_1.id
  route_table_id = aws_route_table.private.id
}


resource "aws_route_table_association" "private_2" {
  subnet_id      = aws_subnet.private_2.id
  route_table_id = aws_route_table.private.id
}


# Application load balancer security group
resource "aws_security_group" "alb_sg" {

  name        = "shopsphere-alb-sg"
  description = "Security group for ShopSphere Application Load Balancer"
  vpc_id      = aws_vpc.shopsphere_vpc.id

  tags = {
    Name        = "shopsphere-alb-sg"
    Environment = "dev"
    Project     = "ShopSphere"

  }

}


# Application Services Security Group
resource "aws_security_group" "app_sg" {
  name        = "shopsphere-app-sg"
  description = "Security group for ShopSphere application services"
  vpc_id      = aws_vpc.shopsphere_vpc.id

  tags = {
    Name        = "shopsphere-app-sg"
    Environment = "dev"
    Project     = "ShopSphere"
  }
}

# Allow HTTP traffic from the internet to the ALB
resource "aws_vpc_security_group_ingress_rule" "alb_http" {

  security_group_id = aws_security_group.alb_sg.id

  description = "Allow HTTP traffic from internet"
  cidr_ipv4   = "0.0.0.0/0"
  from_port   = 80
  to_port     = 80
  ip_protocol = "tcp"

}

# Allow ALB to communicate with API Gateway
resource "aws_vpc_security_group_ingress_rule" "app_from_alb" {
  security_group_id            = aws_security_group.app_sg.id
  referenced_security_group_id = aws_security_group.alb_sg.id

  description = "Allow ALB to access API Gateway"
  from_port   = 5000
  to_port     = 5000
  ip_protocol = "tcp"
}

# Allow communication between application services
resource "aws_vpc_security_group_ingress_rule" "app_internal" {
  security_group_id            = aws_security_group.app_sg.id
  referenced_security_group_id = aws_security_group.app_sg.id

  description = "Allow internal communication between ShopSphere services"
  from_port   = 5000
  to_port     = 5004
  ip_protocol = "tcp"
}

# Allow outbound traffic from ALB
resource "aws_vpc_security_group_egress_rule" "alb_outbound" {
  security_group_id = aws_security_group.alb_sg.id

  description = "Allow outbound traffic"
  cidr_ipv4   = "0.0.0.0/0"
  ip_protocol = "-1"
}

# Allow outbound traffic from application services
resource "aws_vpc_security_group_egress_rule" "app_outbound" {
  security_group_id = aws_security_group.app_sg.id

  description = "Allow outbound traffic"
  cidr_ipv4   = "0.0.0.0/0"
  ip_protocol = "-1"
}

# Postgresql database security group
resource "aws_security_group" "db_sg" {

  name        = "shopsphere-db-sg"
  description = "Security group for shopsphere Postgresql database"
  vpc_id      = aws_vpc.shopsphere_vpc.id

  tags = {

    Name        = "shopsphere-db-sg"
    Environment = "dev"
    Project     = "ShopSphere"
  }

}

# Allow PostgreSQL traffic only from application services
resource "aws_vpc_security_group_ingress_rule" "db_from_app" {

  security_group_id            = aws_security_group.db_sg.id
  referenced_security_group_id = aws_security_group.app_sg.id

  description = "Allow Postgresql access from Shopsphere application services"
  from_port   = 5432
  to_port     = 5432
  ip_protocol = "tcp"

}

# Allow outbound traffic from databas
resource "aws_vpc_security_group_egress_rule" "db_outbound" {

  security_group_id = aws_security_group.db_sg.id

  description = "Allow outbound traffic"
  cidr_ipv4   = "0.0.0.0/0"
  ip_protocol = "-1"

}


# S3 Gateway VPC Endpoint
resource "aws_vpc_endpoint" "s3" {

  vpc_id            = aws_vpc.shopsphere_vpc.id
  service_name      = "com.amazonaws.ap-south-1.s3"
  vpc_endpoint_type = "Gateway"

  route_table_ids = [
    aws_route_table.public.id,
    aws_route_table.private.id

  ]

  tags = {

    Name        = "shopsphere-s3-endpoint"
    Environment = "dev"
    Project     = "ShopSphere"
  }

}

# VPC Interface Endpoints Security Group
resource "aws_security_group" "endpoint_sg" {

  name        = "shopsphere-endpoint-sg"
  description = "Allow HTTPS access to AWS VPC endpoints"
  vpc_id      = aws_vpc.shopsphere_vpc.id

  tags = {
    Name        = "shopsphere-endpoint-sg"
    Environment = "dev"
    Project     = "ShopSphere"

  }

}


# Allow HTTPS from ShopSphere application services
resource "aws_vpc_security_group_ingress_rule" "endpoint_https" {
  security_group_id            = aws_security_group.endpoint_sg.id
  referenced_security_group_id = aws_security_group.app_sg.id

  description = "Allow HTTPS from ShopSphere application services"
  from_port   = 443
  to_port     = 443
  ip_protocol = "tcp"
}


# Allow HTTPS from the database EC2 instance to SSM endpoints
resource "aws_vpc_security_group_ingress_rule" "endpoint_https_db" {
  security_group_id            = aws_security_group.endpoint_sg.id
  referenced_security_group_id = aws_security_group.db_sg.id

  description = "Allow HTTPS from database EC2 for Systems Manager"
  from_port   = 443
  to_port     = 443
  ip_protocol = "tcp"
}


# ECR API Interface VPC Endpoint
resource "aws_vpc_endpoint" "ecr_api" {
  vpc_id              = aws_vpc.shopsphere_vpc.id
  service_name        = "com.amazonaws.ap-south-1.ecr.api"
  vpc_endpoint_type   = "Interface"
  private_dns_enabled = true

  subnet_ids = [
    aws_subnet.private_1.id,
    aws_subnet.private_2.id
  ]

  security_group_ids = [
    aws_security_group.endpoint_sg.id
  ]

  tags = {
    Name        = "shopsphere-ecr-api-endpoint"
    Environment = "dev"
    Project     = "ShopSphere"
  }
}


# ECR Docker Interface VPC Endpoint
resource "aws_vpc_endpoint" "ecr_docker" {
  vpc_id              = aws_vpc.shopsphere_vpc.id
  service_name        = "com.amazonaws.ap-south-1.ecr.dkr"
  vpc_endpoint_type   = "Interface"
  private_dns_enabled = true

  subnet_ids = [
    aws_subnet.private_1.id,
    aws_subnet.private_2.id
  ]

  security_group_ids = [
    aws_security_group.endpoint_sg.id
  ]

  tags = {
    Name        = "shopsphere-ecr-docker-endpoint"
    Environment = "dev"
    Project     = "ShopSphere"
  }
}

# Cloudwatch logs interface vpc endpoint
resource "aws_vpc_endpoint" "cloudwatch_logs" {

  vpc_id              = aws_vpc.shopsphere_vpc.id
  service_name        = "com.amazonaws.ap-south-1.logs"
  vpc_endpoint_type   = "Interface"
  private_dns_enabled = true

  subnet_ids = [
    aws_subnet.private_1.id,
    aws_subnet.private_2.id
  ]
  security_group_ids = [
    aws_security_group.endpoint_sg.id
  ]

  tags = {
    Name        = "shopsphere-cloudwatch-logs-endpoint"
    Environment = "dev"
    Project     = "ShopSphere"
  }
}


# Secrets Manager Interface VPC Endpoint
resource "aws_vpc_endpoint" "secrets_manager" {
  vpc_id              = aws_vpc.shopsphere_vpc.id
  service_name        = "com.amazonaws.ap-south-1.secretsmanager"
  vpc_endpoint_type   = "Interface"
  private_dns_enabled = true

  subnet_ids = [
    aws_subnet.private_1.id,
    aws_subnet.private_2.id
  ]

  security_group_ids = [
    aws_security_group.endpoint_sg.id
  ]

  tags = {
    Name        = "shopsphere-secrets-manager-endpoint"
    Environment = "dev"
    Project     = "ShopSphere"
  }
}

# ECS Task Execution Role
resource "aws_iam_role" "ecs_task_execution" {

  name               = "ShopSphereECSTaskExecutionRole"
  assume_role_policy = file("${path.module}/ecs-task-execution-trust-policy.json")

  description = "Allows ECS tasks to pull images, write logs and retrieve secrets"

  tags = {

    Name        = "ShopSphereECSTaskExecutionRole"
    Environment = "dev"
    Project     = "ShopSphere"

  }


}

# ECS Task Role
resource "aws_iam_role" "ecs_task" {
  name               = "ShopSphereECSTaskRole"
  assume_role_policy = file("${path.module}/ecs-task-role-trust-policy.json")

  description = "IAM role for permissions used by ShopSphere application containers"

  tags = {
    Name        = "ShopSphereECSTaskRole"
    Environment = "dev"
    Project     = "ShopSphere"
  }
}

# ECS Task Execution Managed Policy
resource "aws_iam_role_policy_attachment" "ecs_task_execution" {
  role       = aws_iam_role.ecs_task_execution.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
}

data "aws_secretsmanager_secret" "jwt_secret" {
  name = "shopsphere/dev/jwt-secret"
}

data "aws_secretsmanager_secret" "database_password" {
  name = "shopsphere/dev/database-password"
}


# Allow ECS execution role to retrieve only ShopSphere secrets
resource "aws_iam_role_policy" "ecs_secrets_access" {
  name = "ShopSphereSecretsManagerAccess"
  role = aws_iam_role.ecs_task_execution.id

  policy = jsonencode({
    Version = "2012-10-17"

    Statement = [
      {
        Effect = "Allow"

        Action = [
          "secretsmanager:GetSecretValue"
        ]

        Resource = [
          data.aws_secretsmanager_secret.jwt_secret.arn,
          data.aws_secretsmanager_secret.database_password.arn
        ]
      }
    ]
  })
}

# ShopSphere ECS Cluster
resource "aws_ecs_cluster" "shopsphere_cluster" {
  name = "shopsphere-cluster"

  tags = {
    Name        = "shopsphere-cluster"
    Environment = "dev"
    Project     = "ShopSphere"
  }
}

# ECS Cluster Capacity Providers
resource "aws_ecs_cluster_capacity_providers" "shopsphere_capacity" {

  cluster_name = aws_ecs_cluster.shopsphere_cluster.name

  capacity_providers = [
    "FARGATE",
    "FARGATE_SPOT"
  ]

  default_capacity_provider_strategy {
    base              = 1
    weight            = 1
    capacity_provider = "FARGATE"
  }

}

# AWS Cloud Map Private DNS Namespace
resource "aws_service_discovery_private_dns_namespace" "shopsphere" {

  name = "shopsphere.local"

  description = "Private serivce discovery namespace for Shopsphere"

  vpc = aws_vpc.shopsphere_vpc.id

  tags = {

    Name        = "shopsphere-service-discovery"
    Environment = "dev"
    Project     = "ShopSphere"

  }


}

# ShopSphere Microservices - AWS Cloud Map Service Discovery
resource "aws_service_discovery_service" "microservices" {
  for_each = toset([
    "auth-service",
    "product-service",
    "order-service",
    "payment-service"
  ])

  name = each.value

  dns_config {
    namespace_id = aws_service_discovery_private_dns_namespace.shopsphere.id

    dns_records {
      ttl  = 10
      type = "A"
    }

    routing_policy = "MULTIVALUE"
  }

  tags = {
    Environment = "dev"
    Project     = "ShopSphere"
  }
}

# ShopSphere Application Load Balancer
resource "aws_alb" "shopsphere_alb" {

  name               = "shopsphere-alb"
  internal           = false
  load_balancer_type = "application"

  security_groups = [
    aws_security_group.alb_sg.id
  ]

  subnets = [
    aws_subnet.public_1.id,
    aws_subnet.public_2.id
  ]

  enable_deletion_protection = false

  tags = {
    Name        = "shopsphere-alb"
    Environment = "dev"
    Project     = "ShopSphere"
  }

}

# ShopSphere API Gateway Target Group
resource "aws_lb_target_group" "api_gateway" {

  name        = "shopsphere-gateway-tg"
  port        = 5000
  protocol    = "HTTP"
  target_type = "ip"
  vpc_id      = aws_vpc.shopsphere_vpc.id

  health_check {

    enabled             = true
    path                = "/health"
    protocol            = "HTTP"
    matcher             = "200"
    interval            = 30
    timeout             = 5
    healthy_threshold   = 2
    unhealthy_threshold = 3

  }

  tags = {
    Name        = "shopsphere-gateway-tg"
    Environment = "dev"
    Project     = "ShopSphere"
  }

}

# ShopSphere ALB HTTP Listener
resource "aws_lb_listener" "http" {

  load_balancer_arn = aws_alb.shopsphere_alb.arn
  port              = 80
  protocol          = "HTTP"

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.api_gateway.arn
  }

  tags = {
    Name        = "shopsphere-http-listener"
    Environment = "dev"
    Project     = "ShopSphere"
  }


}


# CloudWatch Log Groups for ShopSphere Microservices

resource "aws_cloudwatch_log_group" "api_gateway" {
  name              = "/ecs/shopsphere/api-gateway"
  retention_in_days = 7

  tags = {
    Name        = "shopsphere-api-gateway-logs"
    Environment = "dev"
    Project     = "ShopSphere"
  }
}

resource "aws_cloudwatch_log_group" "auth_service" {
  name              = "/ecs/shopsphere/auth-service"
  retention_in_days = 7

  tags = {
    Name        = "shopsphere-auth-service-logs"
    Environment = "dev"
    Project     = "ShopSphere"
  }
}

resource "aws_cloudwatch_log_group" "product_service" {
  name              = "/ecs/shopsphere/product-service"
  retention_in_days = 7

  tags = {
    Name        = "shopsphere-product-service-logs"
    Environment = "dev"
    Project     = "ShopSphere"
  }
}

resource "aws_cloudwatch_log_group" "order_service" {
  name              = "/ecs/shopsphere/order-service"
  retention_in_days = 7

  tags = {
    Name        = "shopsphere-order-service-logs"
    Environment = "dev"
    Project     = "ShopSphere"
  }
}

resource "aws_cloudwatch_log_group" "payment_service" {
  name              = "/ecs/shopsphere/payment-service"
  retention_in_days = 7

  tags = {
    Name        = "shopsphere-payment-service-logs"
    Environment = "dev"
    Project     = "ShopSphere"
  }
}

# Systems Manager Interface VPC Endpoint
resource "aws_vpc_endpoint" "ssm" {
  vpc_id              = aws_vpc.shopsphere_vpc.id
  service_name        = "com.amazonaws.ap-south-1.ssm"
  vpc_endpoint_type   = "Interface"
  private_dns_enabled = true

  subnet_ids = [
    aws_subnet.private_1.id
  ]

  security_group_ids = [
    aws_security_group.endpoint_sg.id
  ]

  tags = {
    Name        = "shopsphere-ssm-endpoint"
    Environment = "dev"
    Project     = "ShopSphere"
  }
}

# Systems Manager Messages Interface VPC Endpoint
resource "aws_vpc_endpoint" "ssm_messages" {
  vpc_id              = aws_vpc.shopsphere_vpc.id
  service_name        = "com.amazonaws.ap-south-1.ssmmessages"
  vpc_endpoint_type   = "Interface"
  private_dns_enabled = true

  subnet_ids = [
    aws_subnet.private_1.id
  ]

  security_group_ids = [
    aws_security_group.endpoint_sg.id
  ]

  tags = {
    Name        = "shopsphere-ssm-messages-endpoint"
    Environment = "dev"
    Project     = "ShopSphere"
  }
}

# EC2 IAM Role for Systems Manager
resource "aws_iam_role" "ec2_ssm" {
  name = "ShopSphereEC2SSMRole"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Service = "ec2.amazonaws.com"
        }
        Action = "sts:AssumeRole"
      }
    ]
  })

  description = "Allows ShopSphere database EC2 instance to use AWS Systems Manager"

  tags = {
    Name        = "ShopSphereEC2SSMRole"
    Environment = "dev"
    Project     = "ShopSphere"
  }
}

# Attach AWS-managed Systems Manager policy
resource "aws_iam_role_policy_attachment" "ec2_ssm" {
  role       = aws_iam_role.ec2_ssm.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore"
}

# Allow database EC2 instance to retrieve its password
resource "aws_iam_role_policy" "ec2_secrets_access" {
  name = "ShopSphereEC2DatabaseSecretAccess"
  role = aws_iam_role.ec2_ssm.id

  policy = jsonencode({
    Version = "2012-10-17"

    Statement = [
      {
        Effect = "Allow"

        Action = [
          "secretsmanager:GetSecretValue"
        ]

        Resource = [
          data.aws_secretsmanager_secret.database_password.arn
        ]
      }
    ]
  })
}

# EC2 Instance Profile
resource "aws_iam_instance_profile" "shopsphere_ec2" {
  name = "ShopSphereEC2InstanceProfile"
  role = aws_iam_role.ec2_ssm.name

  tags = {
    Name        = "ShopSphereEC2InstanceProfile"
    Environment = "dev"
    Project     = "ShopSphere"
  }
}

# Latest Amazon Linux 2023 AMI
data "aws_ssm_parameter" "amazon_linux_2023" {
  name = "/aws/service/ami-amazon-linux-latest/al2023-ami-kernel-default-x86_64"
}

# ShopSphere PostgreSQL EC2 Instance
resource "aws_instance" "postgres" {
  ami           = "ami-0593d733c2fc5bd2e"
  instance_type = "t3.small"

  subnet_id = aws_subnet.private_1.id

  vpc_security_group_ids = [
    aws_security_group.db_sg.id
  ]

  iam_instance_profile = aws_iam_instance_profile.shopsphere_ec2.name

  associate_public_ip_address = false

  metadata_options {
    http_endpoint = "enabled"
    http_tokens   = "required"
  }

  root_block_device {
    volume_size           = 20
    volume_type           = "gp3"
    encrypted             = true
    delete_on_termination = true
  }

  tags = {
    Name        = "shopsphere-postgres-db"
    Environment = "dev"
    Project     = "ShopSphere"
  }
}

# Persistent PostgreSQL Database Storage
resource "aws_ebs_volume" "postgres_data" {
  availability_zone = aws_subnet.private_1.availability_zone

  size      = 30
  type      = "gp3"
  encrypted = true

  tags = {
    Name        = "shopsphere-postgres-data"
    Environment = "dev"
    Project     = "ShopSphere"
  }

  lifecycle {
    prevent_destroy = true
  }
}

# Attach Persistent Database Storage to EC2
resource "aws_volume_attachment" "postgres_data" {
  device_name = "/dev/sdf"

  volume_id   = aws_ebs_volume.postgres_data.id
  instance_id = aws_instance.postgres.id
}

# resource "aws_route53_record" "postgres" {
#   zone_id = aws_service_discovery_private_dns_namespace.shopsphere.hosted_zone
#   name    = "postgres.shopsphere.local"
#   type    = "A"
#   ttl     = 30

#   records = [
#     aws_instance.postgres.private_ip
#   ]
# }

# Cloud Map service for PostgreSQL
resource "aws_service_discovery_service" "postgres" {
  name = "postgres"

  dns_config {
    namespace_id = aws_service_discovery_private_dns_namespace.shopsphere.id

    dns_records {
      ttl  = 30
      type = "A"
    }

    routing_policy = "MULTIVALUE"
  }

  tags = {
    Environment = "dev"
    Project     = "ShopSphere"
  }
}

# Register PostgreSQL EC2 private IP in Cloud Map
resource "aws_service_discovery_instance" "postgres" {
  instance_id = "postgres-ec2"
  service_id  = aws_service_discovery_service.postgres.id

  attributes = {
    AWS_INSTANCE_IPV4 = aws_instance.postgres.private_ip
  }
}

# API Gateway ECS Fargate Task Definition
data "aws_caller_identity" "current" {}

resource "aws_ecs_task_definition" "api_gateway" {
  family                   = "shopsphere-api-gateway"
  requires_compatibilities = ["FARGATE"]
  network_mode             = "awsvpc"

  cpu    = 256
  memory = 512

  execution_role_arn = aws_iam_role.ecs_task_execution.arn
  task_role_arn      = aws_iam_role.ecs_task.arn

  runtime_platform {
    operating_system_family = "LINUX"
    cpu_architecture        = "X86_64"
  }

  container_definitions = jsonencode([
    {
      name      = "api-gateway"
      image     = "${data.aws_caller_identity.current.account_id}.dkr.ecr.${var.aws_region}.amazonaws.com/shopsphere-api-gateway:v1.0.0"
      essential = true

      portMappings = [
        {
          containerPort = 5000
          protocol      = "tcp"
        }
      ]

      environment = [
        {
          name  = "AUTH_SERVICE_URL"
          value = "http://auth-service.shopsphere.local:5001"
        },
        {
          name  = "PRODUCT_SERVICE_URL"
          value = "http://product-service.shopsphere.local:5002"
        },
        {
          name  = "ORDER_SERVICE_URL"
          value = "http://order-service.shopsphere.local:5003"
        },
        {
          name  = "PAYMENT_SERVICE_URL"
          value = "http://payment-service.shopsphere.local:5004"
        },
        {
          name  = "LOG_LEVEL"
          value = "info"
        }
      ]

      logConfiguration = {
        logDriver = "awslogs"
        options = {
          "awslogs-group"         = aws_cloudwatch_log_group.api_gateway.name
          "awslogs-region"        = var.aws_region
          "awslogs-stream-prefix" = "ecs"
        }
      }
    }
  ])

  tags = {
    Name        = "shopsphere-api-gateway-task"
    Environment = "dev"
    Project     = "ShopSphere"
  }
}


# API Gateway ECS Fargate Service
resource "aws_ecs_service" "api_gateway" {
  name            = "shopsphere-api-gateway"
  cluster         = aws_ecs_cluster.shopsphere_cluster.id
  task_definition = aws_ecs_task_definition.api_gateway.arn
  desired_count   = 1

  lifecycle {
    ignore_changes = [task_definition]
  }

  capacity_provider_strategy {
    capacity_provider = "FARGATE"
    weight            = 1
    base              = 1
  }

  deployment_minimum_healthy_percent = 100
  deployment_maximum_percent         = 200

  health_check_grace_period_seconds = 60

  deployment_circuit_breaker {
    enable   = true
    rollback = true
  }

  network_configuration {
    subnets = [
      aws_subnet.private_1.id,
      aws_subnet.private_2.id
    ]

    security_groups = [
      aws_security_group.app_sg.id
    ]

    assign_public_ip = false
  }

  load_balancer {
    target_group_arn = aws_lb_target_group.api_gateway.arn
    container_name   = "api-gateway"
    container_port   = 5000
  }

  depends_on = [
    aws_lb_listener.http
  ]

  tags = {
    Name        = "shopsphere-api-gateway-service"
    Environment = "dev"
    Project     = "ShopSphere"
  }
}

# Auth Service ECS Fargate Task Definition
resource "aws_ecs_task_definition" "auth_service" {
  family                   = "shopsphere-auth-service"
  requires_compatibilities = ["FARGATE"]
  network_mode             = "awsvpc"

  cpu    = 256
  memory = 512

  execution_role_arn = aws_iam_role.ecs_task_execution.arn
  task_role_arn      = aws_iam_role.ecs_task.arn

  runtime_platform {
    operating_system_family = "LINUX"
    cpu_architecture        = "X86_64"
  }

  container_definitions = jsonencode([
    {
      name      = "auth-service"
      image     = "${data.aws_caller_identity.current.account_id}.dkr.ecr.${var.aws_region}.amazonaws.com/shopsphere-auth-service:v1.0.0"
      essential = true

      portMappings = [
        {
          containerPort = 5001
          protocol      = "tcp"
        }
      ]

      environment = [
        {
          name  = "PORT"
          value = "5001"
        },
        {
          name  = "DB_HOST"
          value = "postgres.shopsphere.local"
        },
        {
          name  = "DB_PORT"
          value = "5432"
        },
        {
          name  = "DB_NAME"
          value = "shopsphere_auth"
        },
        {
          name  = "DB_USER"
          value = "shopsphere"
        },
        {
          name  = "LOG_LEVEL"
          value = "info"
        },
        {
          name  = "JWT_EXPIRES_IN"
          value = "1d"
        }
      ]

      secrets = [
        {
          name      = "DB_PASSWORD"
          valueFrom = data.aws_secretsmanager_secret.database_password.arn
        },
        {
          name      = "JWT_SECRET"
          valueFrom = data.aws_secretsmanager_secret.jwt_secret.arn
        }
      ]

      logConfiguration = {
        logDriver = "awslogs"

        options = {
          "awslogs-group"         = aws_cloudwatch_log_group.auth_service.name
          "awslogs-region"        = var.aws_region
          "awslogs-stream-prefix" = "ecs"
        }
      }
    }
  ])

  tags = {
    Name        = "shopsphere-auth-service-task"
    Environment = "dev"
    Project     = "ShopSphere"
  }
}

# Product Service ECS Fargate Task Definition
resource "aws_ecs_task_definition" "product_service" {
  family                   = "shopsphere-product-service"
  requires_compatibilities = ["FARGATE"]
  network_mode             = "awsvpc"

  cpu    = 256
  memory = 512

  execution_role_arn = aws_iam_role.ecs_task_execution.arn
  task_role_arn      = aws_iam_role.ecs_task.arn

  runtime_platform {
    operating_system_family = "LINUX"
    cpu_architecture        = "X86_64"
  }

  container_definitions = jsonencode([
    {
      name      = "product-service"
      image     = "${data.aws_caller_identity.current.account_id}.dkr.ecr.${var.aws_region}.amazonaws.com/shopsphere-product-service:v1.0.0"
      essential = true

      portMappings = [
        {
          containerPort = 5002
          protocol      = "tcp"
        }
      ]

      environment = [
        {
          name  = "PORT"
          value = "5002"
        },
        {
          name  = "DB_HOST"
          value = "postgres.shopsphere.local"
        },
        {
          name  = "DB_PORT"
          value = "5432"
        },
        {
          name  = "DB_NAME"
          value = "shopsphere_products"
        },
        {
          name  = "DB_USER"
          value = "shopsphere"
        },
        {
          name  = "LOG_LEVEL"
          value = "info"
        }
      ]

      secrets = [
        {
          name      = "DB_PASSWORD"
          valueFrom = data.aws_secretsmanager_secret.database_password.arn
        }
      ]

      logConfiguration = {
        logDriver = "awslogs"

        options = {
          "awslogs-group"         = aws_cloudwatch_log_group.product_service.name
          "awslogs-region"        = var.aws_region
          "awslogs-stream-prefix" = "ecs"
        }
      }
    }
  ])

  tags = {
    Name        = "shopsphere-product-service-task"
    Environment = "dev"
    Project     = "ShopSphere"
  }
}

# Order Service ECS Fargate Task Definition
resource "aws_ecs_task_definition" "order_service" {
  family                   = "shopsphere-order-service"
  requires_compatibilities = ["FARGATE"]
  network_mode             = "awsvpc"

  cpu    = 256
  memory = 512

  execution_role_arn = aws_iam_role.ecs_task_execution.arn
  task_role_arn      = aws_iam_role.ecs_task.arn

  runtime_platform {
    operating_system_family = "LINUX"
    cpu_architecture        = "X86_64"
  }

  container_definitions = jsonencode([
    {
      name      = "order-service"
      image     = "${data.aws_caller_identity.current.account_id}.dkr.ecr.${var.aws_region}.amazonaws.com/shopsphere-order-service:v1.0.0"
      essential = true

      portMappings = [
        {
          containerPort = 5003
          protocol      = "tcp"
        }
      ]

      environment = [
        {
          name  = "PORT"
          value = "5003"
        },
        {
          name  = "DB_HOST"
          value = "postgres.shopsphere.local"
        },
        {
          name  = "DB_PORT"
          value = "5432"
        },
        {
          name  = "DB_NAME"
          value = "shopsphere_orders"
        },
        {
          name  = "DB_USER"
          value = "shopsphere"
        },
        {
          name  = "PRODUCT_SERVICE_URL"
          value = "http://product-service.shopsphere.local:5002"
        },
        {
          name  = "LOG_LEVEL"
          value = "info"
        }
      ]

      secrets = [
        {
          name      = "DB_PASSWORD"
          valueFrom = data.aws_secretsmanager_secret.database_password.arn
        }
      ]

      logConfiguration = {
        logDriver = "awslogs"

        options = {
          "awslogs-group"         = aws_cloudwatch_log_group.order_service.name
          "awslogs-region"        = var.aws_region
          "awslogs-stream-prefix" = "ecs"
        }
      }
    }
  ])

  tags = {
    Name        = "shopsphere-order-service-task"
    Environment = "dev"
    Project     = "ShopSphere"
  }
}

# Payment Service ECS Fargate Task Definition
resource "aws_ecs_task_definition" "payment_service" {
  family                   = "shopsphere-payment-service"
  requires_compatibilities = ["FARGATE"]
  network_mode             = "awsvpc"

  cpu    = 256
  memory = 512

  execution_role_arn = aws_iam_role.ecs_task_execution.arn
  task_role_arn      = aws_iam_role.ecs_task.arn

  runtime_platform {
    operating_system_family = "LINUX"
    cpu_architecture        = "X86_64"
  }

  container_definitions = jsonencode([
    {
      name      = "payment-service"
      image     = "${data.aws_caller_identity.current.account_id}.dkr.ecr.${var.aws_region}.amazonaws.com/shopsphere-payment-service:v1.0.0"
      essential = true

      portMappings = [
        {
          containerPort = 5004
          protocol      = "tcp"
        }
      ]

      environment = [
        {
          name  = "PORT"
          value = "5004"
        },
        {
          name  = "DB_HOST"
          value = "postgres.shopsphere.local"
        },
        {
          name  = "DB_PORT"
          value = "5432"
        },
        {
          name  = "DB_NAME"
          value = "shopsphere_payments"
        },
        {
          name  = "DB_USER"
          value = "shopsphere"
        },
        {
          name  = "ORDER_SERVICE_URL"
          value = "http://order-service.shopsphere.local:5003"
        },
        {
          name  = "LOG_LEVEL"
          value = "info"
        }
      ]

      secrets = [
        {
          name      = "DB_PASSWORD"
          valueFrom = data.aws_secretsmanager_secret.database_password.arn
        }
      ]

      logConfiguration = {
        logDriver = "awslogs"

        options = {
          "awslogs-group"         = aws_cloudwatch_log_group.payment_service.name
          "awslogs-region"        = var.aws_region
          "awslogs-stream-prefix" = "ecs"
        }
      }
    }
  ])

  tags = {
    Name        = "shopsphere-payment-service-task"
    Environment = "dev"
    Project     = "ShopSphere"
  }
}

# Auth Service ECS Fargate Service
resource "aws_ecs_service" "auth_service" {
  name            = "shopsphere-auth-service"
  cluster         = aws_ecs_cluster.shopsphere_cluster.id
  task_definition = aws_ecs_task_definition.auth_service.arn
  desired_count   = 1

  lifecycle {
    ignore_changes = [task_definition]
  }

  capacity_provider_strategy {
    capacity_provider = "FARGATE"
    weight            = 1
    base              = 1
  }

  deployment_minimum_healthy_percent = 100
  deployment_maximum_percent         = 200

  deployment_circuit_breaker {
    enable   = true
    rollback = true
  }

  network_configuration {
    subnets = [
      aws_subnet.private_1.id,
      aws_subnet.private_2.id
    ]

    security_groups = [
      aws_security_group.app_sg.id
    ]

    assign_public_ip = false
  }

  service_registries {
    registry_arn = aws_service_discovery_service.microservices["auth-service"].arn
  }

  tags = {
    Name        = "shopsphere-auth-service"
    Environment = "dev"
    Project     = "ShopSphere"
  }
}

# Product Service ECS Fargate Service
resource "aws_ecs_service" "product_service" {
  name            = "shopsphere-product-service"
  cluster         = aws_ecs_cluster.shopsphere_cluster.id
  task_definition = aws_ecs_task_definition.product_service.arn
  desired_count   = 1

  lifecycle {
    ignore_changes = [task_definition]
  }

  capacity_provider_strategy {
    capacity_provider = "FARGATE"
    weight            = 1
    base              = 1
  }

  deployment_minimum_healthy_percent = 100
  deployment_maximum_percent         = 200

  deployment_circuit_breaker {
    enable   = true
    rollback = true
  }

  network_configuration {
    subnets = [
      aws_subnet.private_1.id,
      aws_subnet.private_2.id
    ]

    security_groups = [
      aws_security_group.app_sg.id
    ]

    assign_public_ip = false
  }

  service_registries {
    registry_arn = aws_service_discovery_service.microservices["product-service"].arn
  }

  tags = {
    Name        = "shopsphere-product-service"
    Environment = "dev"
    Project     = "ShopSphere"
  }
}

# Order Service ECS Fargate Service
resource "aws_ecs_service" "order_service" {
  name            = "shopsphere-order-service"
  cluster         = aws_ecs_cluster.shopsphere_cluster.id
  task_definition = aws_ecs_task_definition.order_service.arn
  desired_count   = 1

  lifecycle {
    ignore_changes = [task_definition]
  }

  capacity_provider_strategy {
    capacity_provider = "FARGATE"
    weight            = 1
    base              = 1
  }

  deployment_minimum_healthy_percent = 100
  deployment_maximum_percent         = 200

  deployment_circuit_breaker {
    enable   = true
    rollback = true
  }

  network_configuration {
    subnets = [
      aws_subnet.private_1.id,
      aws_subnet.private_2.id
    ]

    security_groups = [
      aws_security_group.app_sg.id
    ]

    assign_public_ip = false
  }

  service_registries {
    registry_arn = aws_service_discovery_service.microservices["order-service"].arn
  }

  tags = {
    Name        = "shopsphere-order-service"
    Environment = "dev"
    Project     = "ShopSphere"
  }
}

# Payment Service ECS Fargate Service
resource "aws_ecs_service" "payment_service" {
  name            = "shopsphere-payment-service"
  cluster         = aws_ecs_cluster.shopsphere_cluster.id
  task_definition = aws_ecs_task_definition.payment_service.arn
  desired_count   = 1

  lifecycle {
    ignore_changes = [task_definition]
  }

  capacity_provider_strategy {
    capacity_provider = "FARGATE"
    weight            = 1
    base              = 1
  }

  deployment_minimum_healthy_percent = 100
  deployment_maximum_percent         = 200

  deployment_circuit_breaker {
    enable   = true
    rollback = true
  }

  network_configuration {
    subnets = [
      aws_subnet.private_1.id,
      aws_subnet.private_2.id
    ]

    security_groups = [
      aws_security_group.app_sg.id
    ]

    assign_public_ip = false
  }

  service_registries {
    registry_arn = aws_service_discovery_service.microservices["payment-service"].arn
  }

  tags = {
    Name        = "shopsphere-payment-service"
    Environment = "dev"
    Project     = "ShopSphere"
  }
}